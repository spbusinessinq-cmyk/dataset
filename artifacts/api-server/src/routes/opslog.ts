import { Router, type IRouter } from "express";
import { AppendOpsLogBody } from "@workspace/api-zod";
import { readOpsLog, appendOpsLogEntry } from "../lib/fileStore";
import crypto from "crypto";

const router: IRouter = Router();

router.get("/opslog", (_req, res): void => {
  const entries = readOpsLog();
  res.json(entries);
});

router.post("/opslog", (req, res): void => {
  const parsed = AppendOpsLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const entry = {
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: parsed.data.message,
    level: parsed.data.level,
  };

  appendOpsLogEntry(entry);
  res.status(201).json(entry);
});

export default router;
