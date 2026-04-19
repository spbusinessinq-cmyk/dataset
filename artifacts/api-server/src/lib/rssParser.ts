import { logger } from "./logger";

export interface RssItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

/** Pull content from a single XML tag (handles CDATA) */
function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract href attribute from a link tag (Atom uses <link href="..."/>) */
function extractAtomLink(block: string): string {
  const m = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

/** Parse RSS <item> blocks */
function parseRssItems(xml: string, limit: number): RssItem[] {
  const items: RssItem[] = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
  for (const match of matches) {
    if (items.length >= limit) break;
    const block = match[1];
    items.push({
      title: extractTag(block, "title"),
      description: extractTag(block, "description"),
      pubDate: extractTag(block, "pubDate"),
      link: extractTag(block, "link"),
    });
  }
  return items;
}

/** Parse Atom <entry> blocks (used by SEC EDGAR and other Atom feeds) */
function parseAtomEntries(xml: string, limit: number): RssItem[] {
  const items: RssItem[] = [];
  const matches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);
  for (const match of matches) {
    if (items.length >= limit) break;
    const block = match[1];
    const description = extractTag(block, "summary") || extractTag(block, "content");
    const pubDate = extractTag(block, "updated") || extractTag(block, "published");
    items.push({
      title: extractTag(block, "title"),
      description,
      pubDate,
      link: extractAtomLink(block) || extractTag(block, "id"),
    });
  }
  return items;
}

export interface FeedConfig {
  url: string;
  source: string;
  limit: number;
}

/** Fetch a single RSS or Atom feed and return parsed items */
export async function fetchFeed(config: FeedConfig): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(config.url, {
      headers: {
        "User-Agent": "RSR-DataHub/1.0 (Intelligence Platform; RSS Reader)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn({ url: config.url, status: res.status }, "Feed returned non-OK status");
      return [];
    }

    const xml = await res.text();

    // Try RSS first, fall back to Atom
    let items = parseRssItems(xml, config.limit);
    if (items.length === 0) {
      items = parseAtomEntries(xml, config.limit);
    }

    logger.info({ url: config.url, count: items.length }, "Feed parsed");
    return items;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.warn({ url: config.url }, "Feed request timed out");
    } else {
      logger.warn({ err, url: config.url }, "Feed fetch failed");
    }
    return [];
  }
}
