export interface SourceConfig {
  id: string;
  name: string;
  sourceType: string;
  category: "News" | "Social" | "Document" | "Contract" | "Dataset" | "Filing" | "Market" | "Manual";
  status: "active" | "indexing" | "placeholder" | "inactive";
  description: string;
  url?: string;
}

export const SOURCES: SourceConfig[] = [
  // ─── NEWS ────────────────────────────────────────────
  {
    id: "reuters-world",
    name: "Reuters World Feed",
    sourceType: "RSS",
    category: "News",
    status: "active",
    description: "Global newswire — geopolitical and security events",
    url: "https://www.reuters.com/rssFeed/worldNews",
  },
  {
    id: "nyt-world",
    name: "NYT World Feed",
    sourceType: "RSS",
    category: "News",
    status: "active",
    description: "New York Times international news and analysis",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  },

  // ─── SOCIAL ──────────────────────────────────────────
  {
    id: "reddit-worldnews",
    name: "Reddit /r/WorldNews",
    sourceType: "RSS",
    category: "Social",
    status: "active",
    description: "Reddit WorldNews — crowd-sourced global news signals",
    url: "https://www.reddit.com/r/worldnews/.rss",
  },

  // ─── FILINGS ─────────────────────────────────────────
  {
    id: "sec-edgar",
    name: "SEC EDGAR 8-K Filings",
    sourceType: "Atom",
    category: "Filing",
    status: "active",
    description: "US Securities and Exchange Commission — live 8-K corporate event filings",
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom",
  },

  // ─── MARKET ──────────────────────────────────────────
  {
    id: "coindesk-btc",
    name: "Coindesk BTC/USD",
    sourceType: "API",
    category: "Market",
    status: "active",
    description: "Coindesk real-time Bitcoin price index",
    url: "https://api.coindesk.com/v1/bpi/currentprice.json",
  },

  // ─── CONTRACTS ───────────────────────────────────────
  {
    id: "usaspending",
    name: "USAspending.gov Contracts",
    sourceType: "API",
    category: "Contract",
    status: "active",
    description: "US federal contract awards — USAspending.gov live data",
    url: "https://api.usaspending.gov/api/v2/search/spending_by_award/",
  },

  // ─── DATASETS ────────────────────────────────────────
  {
    id: "uploaded-dataset",
    name: "Uploaded Dataset Queue",
    sourceType: "Dataset",
    category: "Dataset",
    status: "indexing",
    description: "User-uploaded CSV, JSON, and TXT data awaiting normalization",
  },
];

export function getActiveSources() {
  return SOURCES.filter((s) => s.status === "active");
}

export function getSourceById(id: string) {
  return SOURCES.find((s) => s.id === id);
}

export function getRssSources(ids?: string[]) {
  const rssSources = SOURCES.filter((s) => (s.sourceType === "RSS" || s.sourceType === "Atom") && s.status === "active");
  if (!ids || ids.length === 0) return rssSources;
  return rssSources.filter((s) => ids.includes(s.id));
}
