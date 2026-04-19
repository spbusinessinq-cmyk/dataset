import { logger } from "./logger";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

const ANALYSIS_PROMPT = (rawText: string, sourceType: string, engine: string, source: string) => `
You are an intelligence analyst working on a classified data platform called RSR Data Hub.

Analyze the following signal and return ONLY a JSON object. No other text before or after.

Signal source type: ${sourceType}
Analysis engine: ${engine}
Source: ${source}

Raw signal text:
"""
${rawText}
"""

Return this exact JSON structure:
{
  "title": "concise title of this signal (max 10 words)",
  "classification": "one of: CRITICAL, ELEVATED, ROUTINE, WATCH",
  "summary": "2-3 sentence intelligence summary",
  "whyItMatters": "1-2 sentences on strategic significance",
  "confidence": 75,
  "tags": ["tag1", "tag2", "tag3"],
  "entities": ["Entity1", "Entity2", "Entity3"],
  "systemImpact": ["Impact Category 1", "Impact Category 2"]
}

Rules:
- classification must be CRITICAL (severe/immediate threat), ELEVATED (significant risk), ROUTINE (informational), or WATCH (monitor developing situation)
- confidence is an integer 60-98
- tags should be 2-5 short uppercase keywords
- entities are named individuals, organizations, countries, or locations
- systemImpact are broad categories like: Market Risk, Supply Chain, Regulatory, National Security, Energy, Finance, Geopolitical, Health, Cyber
`;

export async function analyzeWithOllama(
  rawText: string,
  sourceType: string,
  engine: string,
  source: string,
): Promise<object | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: ANALYSIS_PROMPT(rawText, sourceType, engine, source),
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn({ status: response.status }, "Ollama returned non-OK status");
      return null;
    }

    const data = (await response.json()) as OllamaResponse;
    const raw = data.response?.trim();

    if (!raw) {
      logger.warn("Ollama returned empty response");
      return null;
    }

    // Extract JSON from possible surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn({ raw }, "Could not extract JSON from Ollama response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info({ model: OLLAMA_MODEL }, "Ollama analysis completed");
    return parsed;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.warn("Ollama request timed out after 30s");
    } else {
      logger.warn({ err }, "Ollama unavailable, falling back to heuristic");
    }
    return null;
  }
}
