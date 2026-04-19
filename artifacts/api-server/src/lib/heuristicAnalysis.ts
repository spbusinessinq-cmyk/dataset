import crypto from "crypto";

// ── Classification keywords ──────────────────────────────────────────────────

const CRITICAL_KEYWORDS = [
  "attack", "strike", "war", "missile", "bomb", "terror", "killed", "invasion",
  "nuclear", "critical", "emergency", "crisis", "breach", "hack", "ransomware",
  "collapse", "crash", "default", "sanctions", "blockade", "seized", "detained",
  "explosion", "casualties", "fatalities", "shut down", "suspended", "impound",
];
const ELEVATED_KEYWORDS = [
  "conflict", "tension", "risk", "threat", "warning", "investigation",
  "dispute", "escalation", "concern", "volatility", "decline", "protest",
  "restriction", "ban", "shutdown", "disruption", "shortage", "fraud",
  "lawsuit", "indictment", "fine", "penalty", "recall", "default", "downgrade",
];
const WATCH_KEYWORDS = [
  "monitor", "watch", "developing", "emerging", "potential", "possible",
  "rumor", "report", "allegation", "unconfirmed", "trend", "shift", "change",
  "proposed", "planned", "expected", "anticipated", "announced", "filed",
];

function detectClassification(text: string): "CRITICAL" | "ELEVATED" | "ROUTINE" | "WATCH" {
  const lower = text.toLowerCase();
  if (CRITICAL_KEYWORDS.some((k) => lower.includes(k))) return "CRITICAL";
  if (ELEVATED_KEYWORDS.some((k) => lower.includes(k))) return "ELEVATED";
  if (WATCH_KEYWORDS.some((k) => lower.includes(k))) return "WATCH";
  return "ROUTINE";
}

// ── Entity extraction ────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? [];
  const common = new Set([
    "The", "This", "That", "These", "Those", "Their", "There", "They",
    "And", "But", "For", "With", "From", "Into", "Over", "Under", "About",
    "After", "Before", "During", "While", "When", "Where", "Which", "What",
    "Said", "Says", "Will", "Would", "Could", "Should", "Also", "More",
    "New", "One", "Two", "Has", "Have", "Been", "Was", "Were", "Are", "Its",
  ]);
  const unique = [...new Set(matches.filter((w) => !common.has(w)))];
  return unique.slice(0, 5);
}

// ── Tag generation (topic-aware) ─────────────────────────────────────────────

function generateTags(text: string, sourceType: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  if (sourceType) tags.push(sourceType.toUpperCase());
  if (lower.match(/\b(market|stock|trade|economy|gdp|inflation|rate|bond|equity|fund)\b/)) tags.push("MARKETS");
  if (lower.match(/\b(war|military|troops|forces|nato|army|navy|missile|weapon)\b/)) tags.push("CONFLICT");
  if (lower.match(/\b(sanction|policy|regulation|law|congress|senate|parliament|bill|act)\b/)) tags.push("POLICY");
  if (lower.match(/\b(supply|chain|logistics|shipping|port|cargo|import|export|freight)\b/)) tags.push("SUPPLY CHAIN");
  if (lower.match(/\b(oil|gas|energy|fuel|opec|pipeline|refinery|power|electric)\b/)) tags.push("ENERGY");
  if (lower.match(/\b(cyber|hack|data|breach|malware|ransomware|phish|intrusion)\b/)) tags.push("CYBER");
  if (lower.match(/\b(china|prc|beijing|chinese)\b/)) tags.push("CHINA");
  if (lower.match(/\b(russia|moscow|kremlin|russian)\b/)) tags.push("RUSSIA");
  if (lower.match(/\b(iran|tehran|iranian)\b/)) tags.push("IRAN");
  if (lower.match(/\b(semiconductor|chip|ai|tech|silicon|quantum|software)\b/)) tags.push("TECHNOLOGY");
  if (lower.match(/\b(geopolit|territorial|border|sovereign|treaty|alliance)\b/)) tags.push("GEOPOLITICAL");
  if (lower.match(/\b(contract|vendor|procurement|bid|award|tender|agreement)\b/)) tags.push("PROCUREMENT");
  if (lower.match(/\b(filing|sec|10-k|8-k|s-1|ipo|quarterly|annual|disclosure)\b/)) tags.push("FILING");
  if (lower.match(/\b(dataset|csv|column|row|record|metric|statistic|index)\b/)) tags.push("DATA");

  return [...new Set(tags)].slice(0, 5);
}

// ── System impact ────────────────────────────────────────────────────────────

function generateSystemImpact(text: string, sourceType: string): string[] {
  const lower = text.toLowerCase();
  const impacts: string[] = [];

  if (lower.match(/\b(market|stock|economy|financial|dollar|currency|bond|equity)\b/)) impacts.push("Market Risk");
  if (lower.match(/\b(supply|chain|logistics|shipping|cargo|port)\b/)) impacts.push("Supply Chain");
  if (lower.match(/\b(regulation|law|policy|compliance|sec|doj|legal)\b/)) impacts.push("Regulatory");
  if (lower.match(/\b(security|military|defense|threat|attack|war)\b/)) impacts.push("National Security");
  if (lower.match(/\b(oil|gas|energy|fuel|power|electric)\b/)) impacts.push("Energy Supply");
  if (lower.match(/\b(cyber|hack|breach|data|ransomware)\b/)) impacts.push("Cyber Threat");
  if (lower.match(/\b(trade|import|export|tariff|sanction)\b/)) impacts.push("Trade Relations");
  if (lower.match(/\b(health|disease|pandemic|virus|outbreak)\b/)) impacts.push("Public Health");
  if (lower.match(/\b(contract|vendor|procurement|award|tender)\b/)) impacts.push("Procurement Risk");
  if (lower.match(/\b(disclosure|filing|fraud|investigation|lawsuit)\b/)) impacts.push("Corporate Risk");

  // sourceType fallbacks
  if (impacts.length === 0) {
    switch (sourceType) {
      case "Contract": impacts.push("Procurement Risk"); break;
      case "Dataset": impacts.push("Data Analysis"); break;
      case "Filing": impacts.push("Corporate Risk"); break;
      case "Market": impacts.push("Market Risk"); break;
      case "Social": impacts.push("Public Sentiment"); break;
      default: impacts.push("General Intelligence"); break;
    }
  }

  return impacts.slice(0, 4);
}

// ── Text helpers ─────────────────────────────────────────────────────────────

function generateTitle(text: string): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text;
  const words = firstSentence.split(/\s+/).slice(0, 9).join(" ");
  return words.length > 5 ? words : "Intelligence Signal Detected";
}

function generateSummary(text: string): string {
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 20);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2).map((s) => s.trim()).join(". ") + ".";
  }
  const truncated = text.slice(0, 300).trim();
  return truncated + (text.length > 300 ? "..." : "");
}

// ── sourceType-aware "Why it matters" framing ────────────────────────────────

function generateWhyItMatters(
  classification: string,
  tags: string[],
  sourceType: string,
): string {
  const tagStr = tags.filter((t) => t !== sourceType.toUpperCase()).slice(0, 2).join(" and ") || "this domain";

  const framings: Record<string, string> = {
    Contract: `Procurement or contractual signal — assess vendor exposure and obligation risk. ${tagStr} dynamics are implicated.`,
    Dataset: `Dataset signal indicating trend or anomaly. Statistical review recommended across ${tagStr} indicators.`,
    Filing: `Corporate disclosure signal — financial, regulatory, or structural change may be in progress. Review ${tagStr} exposure.`,
    Market: `Market or economic indicator signal — potential impact on portfolio, FX, or commodity exposure in ${tagStr}.`,
    Social: `Public sentiment or social signal — monitor narrative velocity and secondhand amplification in ${tagStr}.`,
    Document: `Document signal ingested for review — manual classification recommended for ${tagStr} relevance.`,
    News: "",
  };

  const typeFrame = framings[sourceType] ?? "";

  if (classification === "CRITICAL") {
    return typeFrame || `Immediate operational concern requiring priority assessment. ${tagStr} dynamics are directly implicated.`;
  }
  if (classification === "ELEVATED") {
    return typeFrame || `Developing situation with meaningful downstream risk. Track escalation vectors in ${tagStr}.`;
  }
  if (classification === "WATCH") {
    return typeFrame || `Early-stage indicators suggest monitoring is warranted. Observe ${tagStr} channels.`;
  }
  return typeFrame || "Routine intelligence item logged for record. No immediate action required.";
}

// ── Main export ──────────────────────────────────────────────────────────────

export function heuristicAnalysis(
  rawText: string,
  sourceType: string,
  engine: string,
): object {
  const classification = detectClassification(rawText);
  const entities = extractKeywords(rawText);
  const tags = generateTags(rawText, sourceType);
  const systemImpact = generateSystemImpact(rawText, sourceType);
  const title = generateTitle(rawText);
  const summary = generateSummary(rawText);
  const whyItMatters = generateWhyItMatters(classification, tags, sourceType);

  const baseConfidence =
    classification === "CRITICAL" ? 80 :
    classification === "ELEVATED" ? 72 :
    classification === "WATCH" ? 65 : 60;
  const confidence = Math.min(98, baseConfidence + Math.floor(Math.random() * 12));

  const shortId = crypto.randomBytes(2).toString("hex").toUpperCase();

  return {
    title,
    classification,
    summary,
    whyItMatters,
    confidence,
    tags: tags.length > 0 ? tags : ["INTELLIGENCE"],
    entities: entities.length > 0 ? entities : ["Unknown"],
    systemImpact: systemImpact.length > 0 ? systemImpact : ["General Intelligence"],
    engine,
    sourceType,
    _fallback: true,
    _shortId: shortId,
  };
}
