import crypto from "crypto";

// Keywords that suggest classification levels
const CRITICAL_KEYWORDS = [
  "attack", "strike", "war", "missile", "bomb", "terror", "killed", "invasion",
  "nuclear", "critical", "emergency", "crisis", "breach", "hack", "ransomware",
  "collapse", "crash", "default", "sanctions", "blockade",
];
const ELEVATED_KEYWORDS = [
  "conflict", "tension", "risk", "threat", "warning", "investigation",
  "dispute", "escalation", "concern", "volatility", "decline", "protest",
  "restriction", "ban", "shutdown", "disruption", "shortage",
];
const WATCH_KEYWORDS = [
  "monitor", "watch", "developing", "emerging", "potential", "possible",
  "rumor", "report", "allegation", "unconfirmed",
];

function detectClassification(text: string): "CRITICAL" | "ELEVATED" | "ROUTINE" | "WATCH" {
  const lower = text.toLowerCase();
  if (CRITICAL_KEYWORDS.some((k) => lower.includes(k))) return "CRITICAL";
  if (ELEVATED_KEYWORDS.some((k) => lower.includes(k))) return "ELEVATED";
  if (WATCH_KEYWORDS.some((k) => lower.includes(k))) return "WATCH";
  return "ROUTINE";
}

function extractKeywords(text: string): string[] {
  // Extract capitalized words likely to be entities
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

function generateTags(text: string, sourceType: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  if (sourceType) tags.push(sourceType.toUpperCase());
  if (lower.match(/\b(market|stock|trade|economy|gdp|inflation|rate|bond)\b/)) tags.push("MARKETS");
  if (lower.match(/\b(war|military|troops|forces|nato|army|navy|missile)\b/)) tags.push("CONFLICT");
  if (lower.match(/\b(sanction|policy|regulation|law|congress|senate|parliament)\b/)) tags.push("POLICY");
  if (lower.match(/\b(supply|chain|logistics|shipping|port|cargo|import|export)\b/)) tags.push("SUPPLY CHAIN");
  if (lower.match(/\b(oil|gas|energy|fuel|opec|pipeline|refinery)\b/)) tags.push("ENERGY");
  if (lower.match(/\b(cyber|hack|data|breach|malware|ransomware|phish)\b/)) tags.push("CYBER");
  if (lower.match(/\b(china|prc|beijing|chinese)\b/)) tags.push("CHINA");
  if (lower.match(/\b(russia|moscow|kremlin|russian)\b/)) tags.push("RUSSIA");
  if (lower.match(/\b(iran|tehran|iranian)\b/)) tags.push("IRAN");
  if (lower.match(/\b(semiconductor|chip|ai|tech|silicon|quantum)\b/)) tags.push("TECHNOLOGY");
  if (lower.match(/\b(geopolit|territorial|border|sovereign)\b/)) tags.push("GEOPOLITICAL");

  return [...new Set(tags)].slice(0, 5);
}

function generateSystemImpact(text: string): string[] {
  const lower = text.toLowerCase();
  const impacts: string[] = [];

  if (lower.match(/\b(market|stock|economy|financial|dollar|currency)\b/)) impacts.push("Market Risk");
  if (lower.match(/\b(supply|chain|logistics|shipping|cargo)\b/)) impacts.push("Supply Chain Disruption");
  if (lower.match(/\b(regulation|law|policy|compliance|sec|doj)\b/)) impacts.push("Regulatory Compliance");
  if (lower.match(/\b(security|military|defense|threat|attack|war)\b/)) impacts.push("National Security");
  if (lower.match(/\b(oil|gas|energy|fuel|power|electric)\b/)) impacts.push("Energy Supply");
  if (lower.match(/\b(cyber|hack|breach|data|ransomware)\b/)) impacts.push("Cyber Threat");
  if (lower.match(/\b(trade|import|export|tariff|sanction)\b/)) impacts.push("Trade Relations");
  if (lower.match(/\b(health|disease|pandemic|virus|outbreak)\b/)) impacts.push("Public Health");

  if (impacts.length === 0) impacts.push("General Intelligence");
  return impacts.slice(0, 4);
}

function generateTitle(text: string): string {
  // Take first meaningful sentence fragment
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text;
  const words = firstSentence.split(/\s+/).slice(0, 8).join(" ");
  return words.length > 5 ? words : "Intelligence Signal Detected";
}

function generateSummary(text: string): string {
  const sentences = text.split(/[.!?]/).filter((s) => s.trim().length > 20);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2).map((s) => s.trim()).join(". ") + ".";
  }
  const truncated = text.slice(0, 280).trim();
  return truncated + (text.length > 280 ? "..." : "");
}

function generateWhyItMatters(classification: string, tags: string[]): string {
  if (classification === "CRITICAL") {
    return `This signal represents an immediate operational concern requiring priority assessment. ${tags.slice(0, 2).join(" and ")} dynamics are directly implicated.`;
  }
  if (classification === "ELEVATED") {
    return `Developing situation with meaningful downstream risk. Analysts should track escalation vectors related to ${tags.slice(0, 2).join(" and ")}.`;
  }
  if (classification === "WATCH") {
    return `Early-stage indicators suggest monitoring is warranted. Continued observation recommended across ${tags.slice(0, 2).join(" and ")} channels.`;
  }
  return `Routine intelligence item logged for record. No immediate action required.`;
}

export function heuristicAnalysis(
  rawText: string,
  sourceType: string,
  engine: string,
): object {
  const classification = detectClassification(rawText);
  const entities = extractKeywords(rawText);
  const tags = generateTags(rawText, sourceType);
  const systemImpact = generateSystemImpact(rawText);
  const title = generateTitle(rawText);
  const summary = generateSummary(rawText);
  const whyItMatters = generateWhyItMatters(classification, tags);

  // Confidence varies by classification
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
    _fallback: true,
    _shortId: shortId,
  };
}
