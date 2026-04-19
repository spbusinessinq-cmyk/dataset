import { Router, type IRouter } from "express";
import crypto from "crypto";
import { fetchFeed } from "../lib/rssParser";
import { readSignals, writeSignals, appendOpsLogEntry } from "../lib/fileStore";

const router: IRouter = Router();

const RSS_FEEDS = [
  {
    url: "https://www.reuters.com/rssFeed/worldNews",
    source: "Reuters",
    limit: 5,
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    source: "NYT",
    limit: 5,
  },
];

router.get("/ingest", async (req, res): Promise<void> => {
  req.log.info("RSS ingest started");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: "RSS ingest started — fetching Reuters and NYT feeds",
    level: "info",
  });

  // Fetch all feeds in parallel
  const feedResults = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f)));

  // Build current signal list to determine next ID
  const existingSignals = readSignals() as Array<{ id: string }>;
  let nextId = existingSignals.length + 1;

  const newSignals: object[] = [];

  for (let feedIdx = 0; feedIdx < feedResults.length; feedIdx++) {
    const items = feedResults[feedIdx];
    const feedConfig = RSS_FEEDS[feedIdx];

    for (const item of items) {
      if (!item.title) continue;

      const signalId = `SG-${String(nextId).padStart(4, "0")}`;
      nextId++;

      const confidence = Math.floor(60 + Math.random() * 21); // 60–80

      const signal = {
        id: signalId,
        title: item.title.slice(0, 120),
        classification: "WATCH",
        source: feedConfig.source,
        summary: item.description
          ? item.description.slice(0, 400)
          : `Signal ingested from ${feedConfig.source} RSS feed.`,
        whyItMatters: `Live signal from ${feedConfig.source} — requires review and classification by analyst.`,
        confidence,
        tags: [feedConfig.source.toUpperCase(), "RSS", "LIVE"],
        entities: [],
        systemImpact: ["Monitoring"],
        engine: "INGEST",
        timestamp: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
      };

      newSignals.push(signal);
    }
  }

  if (newSignals.length > 0) {
    // Prepend new signals, avoiding duplicates by title
    const existingTitles = new Set(
      (existingSignals as Array<{ title: string }>).map((s) => s.title),
    );
    const deduped = newSignals.filter(
      (s) => !existingTitles.has((s as { title: string }).title),
    );

    if (deduped.length > 0) {
      writeSignals([...deduped, ...existingSignals]);
    }

    req.log.info({ total: newSignals.length, saved: deduped.length }, "RSS ingest complete");
  }

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `RSS ingest complete — ${newSignals.length} signals pulled (Reuters + NYT)`,
    level: "info",
  });

  res.json(newSignals);
});

export default router;
