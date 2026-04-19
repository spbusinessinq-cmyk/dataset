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
  {
    id: "feed-001",
    name: "Reuters World Feed",
    status: "active",
    description: "Global newswire — real-time geopolitical and market events",
  },
  {
    id: "feed-002",
    name: "OSINT Monitor v2",
    status: "active",
    description: "Open-source intelligence aggregator across public channels",
  },
  {
    id: "feed-003",
    name: "SEC EDGAR Filings",
    status: "indexing",
    description: "US Securities and Exchange Commission filing database",
  },
  {
    id: "feed-004",
    name: "Dark Web Signals",
    status: "inactive",
    description: "Monitored dark-web forums and markets — manual trigger only",
  },
  {
    id: "feed-005",
    name: "Custom Dataset: trade_2025.csv",
    status: "active",
    description: "Uploaded trade flow dataset — Q1-Q2 2025",
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
    message: "Dataset trade_2025.csv successfully indexed (12,847 records)",
    level: "info",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    message: "New signal ingested from Reuters World Feed — classified ELEVATED",
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
