import { Router, type IRouter } from "express";
import crypto from "crypto";
import { fetchFeed, type RssItem } from "../lib/rssParser";
import { appendOpsLogEntry } from "../lib/fileStore";

// ── Last pull time (module-level, exposed to status route) ───────────────────
export let lastPullTime: string | null = null;

const router: IRouter = Router();

// ── Source definitions ───────────────────────────────────────────────────────

const RSS_SOURCES = [
  { url: "https://www.reuters.com/rssFeed/worldNews", name: "Reuters World", sourceType: "News" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World", sourceType: "News" },
  { url: "https://www.reddit.com/r/worldnews/.rss", name: "Reddit /r/WorldNews", sourceType: "Social" },
  {
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom",
    name: "SEC EDGAR",
    sourceType: "Filing",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
  return `C-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function normalizeRss(items: RssItem[], source: string, sourceType: string): object[] {
  return items
    .filter((i) => i.title)
    .map((item) => ({
      id: makeId(),
      title: item.title.slice(0, 120),
      summary: item.description ? item.description.slice(0, 400) : `Live signal from ${source}.`,
      source,
      sourceType,
      timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      rawText: item.description ? `${item.title}. ${item.description}` : item.title,
      classification: "WATCH",
      confidence: Math.floor(60 + Math.random() * 21),
      tags: [sourceType.toUpperCase(), "LIVE"],
      entities: [],
      systemImpact: ["Monitoring"],
      engine: "INGEST",
      status: "pulled",
      whyItMatters: `Live signal from ${source} — requires review and classification.`,
    }));
}

async function fetchCoindesk(): Promise<object[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://api.coindesk.com/v1/bpi/currentprice.json", {
      signal: controller.signal,
      headers: { "User-Agent": "RSR-DataHub/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json() as Record<string, unknown>;
    const bpi = data?.bpi as Record<string, { rate: string; description: string }> | undefined;
    const usd = bpi?.USD;
    if (!usd) return [];

    const time = data?.time as Record<string, string> | undefined;
    return [{
      id: makeId(),
      title: `BTC/USD — ${usd.rate}`,
      summary: `Bitcoin price: ${usd.rate} USD. ${String(data.disclaimer ?? "")}`.trim(),
      source: "Coindesk",
      sourceType: "Market",
      timestamp: time?.updatedISO ?? new Date().toISOString(),
      rawText: `Bitcoin trading at ${usd.rate} USD. Source: Coindesk BPI. Updated: ${time?.updated ?? "now"}.`,
      classification: "WATCH",
      confidence: 88,
      tags: ["MARKET", "BTC", "CRYPTO"],
      entities: ["Bitcoin", "USD"],
      systemImpact: ["Market Risk"],
      engine: "INGEST",
      status: "pulled",
      whyItMatters: "Real-time BTC/USD market data — monitor for volatility and macro signals.",
    }];
  } catch {
    return [];
  }
}

async function fetchUSASpending(): Promise<object[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RSR-DataHub/1.0",
      },
      body: JSON.stringify({
        filters: { award_type_codes: ["A", "B", "C", "D"] },
        fields: ["Award ID", "Recipient Name", "Award Amount", "Description", "Start Date"],
        page: 1,
        limit: 5,
        sort: "Award Amount",
        order: "desc",
        subawards: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json() as Record<string, unknown>;
    const results = (data?.results ?? []) as Array<Record<string, unknown>>;

    return results.map((award) => {
      const awardId = String(award["Award ID"] ?? "CONTRACT");
      const recipient = String(award["Recipient Name"] ?? "Unknown Vendor");
      const amount = Number(award["Award Amount"] ?? 0);
      const desc = String(award["Description"] ?? "Federal contract award");
      return {
        id: makeId(),
        title: `${awardId} — ${recipient.slice(0, 60)}`,
        summary: `${desc.slice(0, 200)}. Award: $${amount.toLocaleString()} USD.`,
        source: "USAspending.gov",
        sourceType: "Contract",
        timestamp: new Date().toISOString(),
        rawText: `Contract ${awardId} awarded to ${recipient} for $${amount.toLocaleString()} USD. ${desc}`,
        classification: "WATCH",
        confidence: 75,
        tags: ["CONTRACT", "PROCUREMENT", "FEDERAL"],
        entities: [recipient.slice(0, 40), awardId],
        systemImpact: ["Procurement Risk"],
        engine: "INGEST",
        status: "pulled",
        whyItMatters: "Federal contract award — assess vendor exposure and procurement implications.",
      };
    });
  } catch {
    return [];
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

router.get("/ingest/all", async (req, res): Promise<void> => {
  req.log.info("Ingest-all started");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: "Full live ingest initiated — News, Social, Filings, Market, Contracts",
    level: "info",
  });

  const settled = await Promise.allSettled([
    ...RSS_SOURCES.map(({ url, name, sourceType }) =>
      fetchFeed({ url, source: name, limit: 5 }).then((items) => normalizeRss(items, name, sourceType))
    ),
    fetchCoindesk(),
    fetchUSASpending(),
  ]);

  const all: object[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") all.push(...result.value);
  }

  // Dedupe by title prefix
  const seen = new Set<string>();
  const deduped = all.filter((c) => {
    const key = ((c as { title: string }).title ?? "").slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  lastPullTime = new Date().toISOString();

  req.log.info({ count: deduped.length }, "Ingest-all complete");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `Live ingest complete — ${deduped.length} candidates returned (News, Social, Filing, Market, Contract)`,
    level: "info",
  });

  res.json(deduped);
});

export default router;
