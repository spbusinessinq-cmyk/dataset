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
  {
    id: "reuters-business",
    name: "Reuters Business Feed",
    sourceType: "RSS",
    category: "News",
    status: "active",
    description: "Reuters business and financial news wire",
    url: "https://feeds.reuters.com/reuters/businessNews",
  },

  // ─── FILINGS ─────────────────────────────────────────
  {
    id: "sec-edgar",
    name: "SEC / EDGAR Monitor",
    sourceType: "Filing",
    category: "Filing",
    status: "placeholder",
    description: "US Securities and Exchange Commission — 8-K, 10-K, S-1 filings",
  },

  // ─── CONTRACTS ───────────────────────────────────────
  {
    id: "contracts-intake",
    name: "Contract Dataset Intake",
    sourceType: "Contract",
    category: "Contract",
    status: "placeholder",
    description: "Structured contract intake — vendor, procurement, and bilateral agreements",
  },

  // ─── MARKET ──────────────────────────────────────────
  {
    id: "market-watch",
    name: "Market / Economic Feed",
    sourceType: "Market",
    category: "Market",
    status: "placeholder",
    description: "FX, commodity, and macro economic indicator stream",
  },

  // ─── SOCIAL ──────────────────────────────────────────
  {
    id: "social-web",
    name: "Social / Web Monitor",
    sourceType: "Social",
    category: "Social",
    status: "placeholder",
    description: "Open-source social signal and web trend monitor",
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
  const rssSources = SOURCES.filter((s) => s.sourceType === "RSS" && s.status === "active");
  if (!ids || ids.length === 0) return rssSources;
  return rssSources.filter((s) => ids.includes(s.id));
}
