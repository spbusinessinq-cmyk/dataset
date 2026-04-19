// Signal type — shared across the app
export type Signal = {
  id: string;
  title: string;
  classification: "CRITICAL" | "ELEVATED" | "ROUTINE" | "WATCH";
  source: string;
  sourceType?: "News" | "Social" | "Document" | "Contract" | "Dataset" | "Filing" | "Market" | "Manual";
  summary: string;
  whyItMatters: string;
  confidence: number;
  tags: string[];
  entities: string[];
  engine: string;
  timestamp: string;
  systemImpact: string[];
  status?: "pulled" | "uploaded" | "analyzed" | "saved" | "published";
  rawText?: string;
};

// Fallback mock data used when backend is unavailable
export const FALLBACK_SIGNALS: Signal[] = [
  {
    id: "SG-0005",
    title: "Fed Signals Extended Hold — Mortgage Market Impact",
    classification: "ELEVATED",
    source: "Reuters",
    summary: "Federal Reserve signals extended hold on rate cuts, impacting mortgage and bond markets.",
    whyItMatters: "Prolonged high rates will suppress housing demand and increase refinancing risk.",
    confidence: 79,
    tags: ["MARKETS", "POLICY"],
    entities: ["Federal Reserve", "Treasury"],
    systemImpact: ["Market Risk", "Regulatory Compliance"],
    engine: "SAGE",
    timestamp: "2026-04-19T04:11:00Z",
  },
  {
    id: "SG-0004",
    title: "NATO Emergency Session Called — Nordic Theater",
    classification: "CRITICAL",
    source: "OSINT",
    summary: "NATO convenes emergency session over escalating tensions in the Nordic theater.",
    whyItMatters: "Article 5 activation risk increases with each unresolved provocation.",
    confidence: 93,
    tags: ["CONFLICT", "GEOPOLITICAL"],
    entities: ["NATO", "Norway", "Finland"],
    systemImpact: ["National Security", "Energy Supply"],
    engine: "Intel Board",
    timestamp: "2026-04-19T03:58:00Z",
  },
  {
    id: "SG-0003",
    title: "SEC Investigation: Algorithmic Trading Irregularities",
    classification: "ELEVATED",
    source: "SEC EDGAR",
    summary: "SEC opens formal investigation into pattern of algorithmic front-running across multiple broker-dealers.",
    whyItMatters: "Potential market-wide liquidity risk if key participants face trading suspensions.",
    confidence: 81,
    tags: ["POLICY", "MARKETS"],
    entities: ["SEC", "Citadel", "Virtu Financial"],
    systemImpact: ["Regulatory Compliance", "Market Risk"],
    engine: "Sentrix",
    timestamp: "2026-04-19T03:44:00Z",
  },
];

export const SYSTEM_METRICS = {
  apiStatus: "ONLINE",
  signalsProcessed: "1,247",
  queueDepth: 3,
  avgConfidence: "83%",
  storageUsed: "2.4 GB / 10 GB",
};

export const FALLBACK_LOGS = [
  "[SYSTEM] Using local fallback — backend connection unavailable",
  "[INFO] RSR Data Hub initialized in degraded mode",
];
