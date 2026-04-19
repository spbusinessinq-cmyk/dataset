import { Router, type IRouter } from "express";
import { readSignals } from "../lib/fileStore";
import { lastPullTime } from "./ingestAll";

const router: IRouter = Router();

router.get("/status", async (_req, res): Promise<void> => {
  // Check Ollama availability with a short timeout
  let ollamaStatus = "offline";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const ollamaRes = await fetch(
      `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/tags`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (ollamaRes.ok) ollamaStatus = "online";
  } catch {
    // Ollama not available — expected in most environments
  }

  const signalCount = (readSignals() as unknown[]).length;

  res.json({
    backend: "online",
    ollama: ollamaStatus,
    signalCount,
    lastPullTime,
  });
});

export default router;
