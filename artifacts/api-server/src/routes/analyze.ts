import { Router, type IRouter } from "express";
import { AnalyzeSignalBody } from "@workspace/api-zod";
import { analyzeWithOllama } from "../lib/ollamaService";
import { heuristicAnalysis } from "../lib/heuristicAnalysis";
import { readSignals } from "../lib/fileStore";

const router: IRouter = Router();

// Engine display name mapping
const ENGINE_LABELS: Record<string, string> = {
  sentrix: "Sentrix",
  axion: "AXION",
  sage: "SAGE",
  intel_board: "Intel Board",
};

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { rawText, sourceType, engine, source } = parsed.data;
  const engineLabel = ENGINE_LABELS[engine] ?? engine;

  req.log.info({ sourceType, engine }, "Starting signal analysis");

  // Attempt Ollama analysis first, fall back to heuristic
  let analysisData: Record<string, unknown> | null = await analyzeWithOllama(
    rawText,
    sourceType,
    engineLabel,
    source,
  );

  if (!analysisData) {
    req.log.info("Using heuristic fallback analysis");
    analysisData = heuristicAnalysis(rawText, sourceType, engineLabel) as Record<string, unknown>;
  }

  // Generate a sequential signal ID
  const existingSignals = readSignals();
  const nextId = existingSignals.length + 1;
  const signalId = `SG-${String(nextId).padStart(4, "0")}`;

  // Build the final signal object
  const signal = {
    id: signalId,
    title: String(analysisData.title ?? "Untitled Signal"),
    classification: validateClassification(String(analysisData.classification ?? "ROUTINE")),
    source: source || sourceType,
    summary: String(analysisData.summary ?? "Analysis summary unavailable."),
    whyItMatters: String(analysisData.whyItMatters ?? "Strategic significance under review."),
    confidence: clampConfidence(Number(analysisData.confidence ?? 70)),
    tags: ensureStringArray(analysisData.tags),
    entities: ensureStringArray(analysisData.entities),
    systemImpact: ensureStringArray(analysisData.systemImpact),
    engine: engineLabel,
    timestamp: new Date().toISOString(),
  };

  req.log.info({ signalId, classification: signal.classification, confidence: signal.confidence }, "Analysis complete");
  res.json(signal);
});

function validateClassification(value: string): "CRITICAL" | "ELEVATED" | "ROUTINE" | "WATCH" {
  const valid = ["CRITICAL", "ELEVATED", "ROUTINE", "WATCH"];
  const upper = value.toUpperCase();
  return valid.includes(upper) ? (upper as "CRITICAL" | "ELEVATED" | "ROUTINE" | "WATCH") : "ROUTINE";
}

function clampConfidence(value: number): number {
  if (isNaN(value)) return 70;
  return Math.max(50, Math.min(98, Math.round(value)));
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter((v) => v.length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((v) => v.trim()).filter((v) => v.length > 0);
  }
  return [];
}

export default router;
