export type Signal = {
  id: string;
  title: string;
  classification: "CRITICAL" | "ELEVATED" | "ROUTINE";
  source: string;
  summary: string;
  whyItMatters: string;
  confidence: number;
  tags: string[];
  entities: string[];
  engine: string;
  timestamp: string;
  systemImpact: string[];
};

export const MOCK_SIGNAL: Signal = {
  id: "SG-0043",
  title: "PRC Export Controls on Advanced Semiconductors — Second Wave",
  classification: "CRITICAL",
  source: "Reuters World / OSINT",
  summary: "China has announced a second round of export restrictions targeting advanced semiconductor manufacturing equipment, effective Q3 2025. The controls expand on 2023 measures and directly implicate US-listed firms operating joint ventures in the Yangtze River Delta.",
  whyItMatters: "The restrictions will accelerate decoupling timelines and force affected firms to restructure supply chains within 90 days. US Commerce Department expected to respond with counter-measures.",
  confidence: 87,
  tags: ["SUPPLY CHAIN", "GEOPOLITICAL", "SEMICONDUCTOR", "TRADE"],
  entities: ["People's Republic of China", "US Commerce Dept", "ASML", "Applied Materials", "Yangtze River Delta"],
  engine: "AXION",
  timestamp: "2025-04-19T04:17:00Z",
  systemImpact: ["Market Risk", "Regulatory Compliance", "National Security", "Supply Chain Disruption"]
};

export const RECENT_SIGNALS = [
  { id: "SG-0042", title: "Fed Signals Extended Hold — Mortgage Market Impact", engine: "SAGE", classification: "ELEVATED", confidence: 79, timestamp: "Apr 19 04:11" },
  { id: "SG-0041", title: "NATO Emergency Session Called — Nordic Theater", engine: "Intel Board", classification: "CRITICAL", confidence: 93, timestamp: "Apr 19 03:58" },
  { id: "SG-0040", title: "SEC Investigation: Algorithmic Trading Irregularities", engine: "Sentrix", classification: "ELEVATED", confidence: 81, timestamp: "Apr 19 03:44" },
  { id: "SG-0039", title: "OpenAI Government Contract: $600M DoD Partnership", engine: "AXION", classification: "ROUTINE", confidence: 74, timestamp: "Apr 19 03:30" },
  { id: "SG-0038", title: "Brazilian Real Flash Crash — Central Bank Intervention", engine: "SAGE", classification: "ELEVATED", confidence: 88, timestamp: "Apr 19 03:12" },
];

export const ACTIVE_FEEDS = [
  { name: "Reuters World Feed", status: "ACTIVE" },
  { name: "OSINT Monitor v2", status: "ACTIVE" },
  { name: "SEC EDGAR Filings", status: "INDEXING" },
  { name: "Dark Web Signals", status: "INACTIVE" },
  { name: "Custom Dataset: trade_2025.csv", status: "ACTIVE" },
];

export const SYSTEM_METRICS = {
  apiStatus: "ONLINE",
  signalsProcessed: "1,247",
  queueDepth: 3,
  avgConfidence: "83%",
  storageUsed: "2.4 GB / 10 GB"
};

export const INITIAL_LOGS = [
  "[04:16:55] New signal ingested from Reuters World Feed — classified ELEVATED",
  "[04:16:20] Dataset trade_2025.csv successfully indexed (12,847 records)",
  "[04:15:44] System self-check passed — all engines nominal",
  "[04:15:01] Publish request sent for signal #SG-0039 — pending review",
  "[04:12:30] Sentrix engine updated to v2.4.1",
  "[04:10:15] Routine database backup completed"
];