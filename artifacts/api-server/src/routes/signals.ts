import { Router, type IRouter } from "express";
import { SaveSignalBody } from "@workspace/api-zod";
import { readSignals, writeSignals } from "../lib/fileStore";

const router: IRouter = Router();

router.get("/signals", (_req, res): void => {
  const signals = readSignals();
  res.json(signals);
});

router.post("/signals", (req, res): void => {
  const parsed = SaveSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const signals = readSignals();
  // Avoid duplicates by checking id
  const exists = (signals as Array<{ id: string }>).some((s) => s.id === parsed.data.id);
  if (!exists) {
    signals.unshift(parsed.data);
    writeSignals(signals);
  }

  res.status(201).json(parsed.data);
});

export default router;
