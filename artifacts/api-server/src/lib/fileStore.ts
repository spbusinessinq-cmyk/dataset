import fs from "fs";
import path from "path";
import { logger } from "./logger";

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "data");

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
  // ─── NEWS ────────────────────────────────────────────────────────────────
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
    id: "feed-reuters-biz",
    name: "Reuters Business Feed",
    status: "active",
    description: "Reuters business and financial news wire",
    sourceType: "RSS",
    category: "News",
  },

  // ─── FILINGS ─────────────────────────────────────────────────────────────
  {
    id: "feed-sec-edgar",
    name: "SEC / EDGAR Monitor",
    status: "placeholder",
    description: "US Securities filings — 8-K, 10-K, S-1 intake",
    sourceType: "Filing",
    category: "Filing",
  },

  // ─── CONTRACTS ───────────────────────────────────────────────────────────
  {
    id: "feed-contracts",
    name: "Contract Dataset Intake",
    status: "placeholder",
    description: "Vendor, procurement, and bilateral agreement intake",
    sourceType: "Contract",
    category: "Contract",
  },

  // ─── MARKET ──────────────────────────────────────────────────────────────
  {
    id: "feed-market",
    name: "Market / Economic Feed",
    status: "placeholder",
    description: "FX, commodity, and macro economic indicator stream",
    sourceType: "Market",
    category: "Market",
  },

  // ─── SOCIAL ──────────────────────────────────────────────────────────────
  {
    id: "feed-social",
    name: "Social / Web Monitor",
    status: "placeholder",
    description: "Open-source social signal and web trend monitor",
    sourceType: "Social",
    category: "Social",
  },

  // ─── DATASETS ────────────────────────────────────────────────────────────
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
    message: "Multi-source intake model initialized — News, Filing, Contract, Market, Social, Dataset lanes active",
    level: "info",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    message: "RSS feeds online — Reuters World, NYT World, Reuters Business",
    level: "info",
  },
];

export function readSignals() {
  return readFile<object[]>("signals", []);
}

export function writeSignals(signals: object[]) {
  writeFile("signals", signals);
}

export function readPublished() {
  return readFile<object[]>("published", []);
}

export function writePublished(published: object[]) {
  writeFile("published", published);
}

export function readFeeds() {
  return readFile("feeds", feedsDefault);
}

export function readOpsLog() {
  return readFile<object[]>("opslog", opsLogDefault);
}

export function writeOpsLog(entries: object[]) {
  writeFile("opslog", entries);
}

export function appendOpsLogEntry(entry: object) {
  const entries = readOpsLog();
  entries.unshift(entry);
  writeFile("opslog", entries);
}
