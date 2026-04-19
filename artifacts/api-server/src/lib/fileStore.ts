import fs from "fs";
import path from "path";
import { logger } from "./logger";

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "data");

const SIGNALS_CAP = 250;
const OPSLOG_CAP = 500;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info({ dataDir: DATA_DIR }, "Created data directory");
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readFile<T>(name: string, defaultValue: T): T {
  ensureDataDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    writeFile(name, defaultValue);
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error({ err, name }, "Failed to read data file, using default");
    return defaultValue;
  }
}

function writeFile<T>(name: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}

export const feedsDefault = [
  {
    id: "feed-reuters-world",
    name: "Reuters World Feed",
    status: "active",
    description: "Global newswire — geopolitical and security events",
    sourceType: "RSS",
    category: "News",
  },
  {
    id: "feed-nyt-world",
    name: "NYT World Feed",
    status: "active",
    description: "New York Times international news and analysis",
    sourceType: "RSS",
    category: "News",
  },
  {
    id: "feed-reddit-worldnews",
    name: "Reddit /r/WorldNews",
    status: "active",
    description: "Reddit crowd-sourced global news signals",
    sourceType: "RSS",
    category: "Social",
  },
  {
    id: "feed-sec-edgar",
    name: "SEC EDGAR 8-K Filings",
    status: "active",
    description: "US Securities filings — live 8-K corporate event intake",
    sourceType: "Atom",
    category: "Filing",
  },
  {
    id: "feed-coindesk-btc",
    name: "Coindesk BTC/USD",
    status: "active",
    description: "Real-time Bitcoin price index — market signal feed",
    sourceType: "API",
    category: "Market",
  },
  {
    id: "feed-usaspending",
    name: "USAspending.gov Contracts",
    status: "active",
    description: "US federal contract awards — live procurement data",
    sourceType: "API",
    category: "Contract",
  },
  {
    id: "feed-datasets",
    name: "Uploaded Dataset Queue",
    status: "indexing",
    description: "User-uploaded CSV, JSON, and TXT awaiting normalization",
    sourceType: "Dataset",
    category: "Dataset",
  },
];

export const opsLogDefault = [
  {
    id: "log-001",
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    message: "System self-check passed — all engines nominal",
    level: "info",
  },
  {
    id: "log-002",
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    message: "Live source grid online — Reuters, NYT, Reddit, SEC EDGAR, Coindesk, USAspending",
    level: "info",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    message: "Heuristic analysis engine ready — Ollama optional, fallback active",
    level: "info",
  },
];

export function readSignals() {
  return readFile<object[]>("signals", []);
}

export function writeSignals(signals: object[]) {
  writeFile("signals", signals.slice(0, SIGNALS_CAP));
}

export function readPublished() {
  return readFile<object[]>("published", []);
}

export function writePublished(published: object[]) {
  writeFile("published", published.slice(0, SIGNALS_CAP));
}

export function readFeeds() {
  return readFile("feeds", feedsDefault);
}

export function readOpsLog() {
  return readFile<object[]>("opslog", opsLogDefault);
}

export function writeOpsLog(entries: object[]) {
  writeFile("opslog", entries.slice(0, OPSLOG_CAP));
}

export function appendOpsLogEntry(entry: object) {
  const entries = readOpsLog();
  entries.unshift(entry);
  writeFile("opslog", entries.slice(0, OPSLOG_CAP));
}
