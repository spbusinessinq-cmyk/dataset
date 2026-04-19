import { Router, type IRouter } from "express";
import crypto from "crypto";
import { parseFileContent } from "../lib/fileIngestParser";
import { readSignals, appendOpsLogEntry } from "../lib/fileStore";

const router: IRouter = Router();

router.post("/ingest/file", (req, res): void => {
  const { content, fileName, fileType, sourceType } = req.body as {
    content: string;
    fileName: string;
    fileType: "csv" | "json" | "txt";
    sourceType?: string;
  };

  if (!content || !fileName || !fileType) {
    res.status(400).json({ error: "content, fileName, and fileType are required" });
    return;
  }

  req.log.info({ fileName, fileType }, "File ingest started");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `File ingest started — ${fileName} (${fileType.toUpperCase()})`,
    level: "info",
  });

  const records = parseFileContent(content, fileName, fileType);

  const existingSignals = readSignals() as Array<{ id: string }>;
  let nextId = existingSignals.length + 1;

  const resolvedSourceType = sourceType ?? (fileType === "csv" || fileType === "json" ? "Dataset" : "Document");

  const signals = records.map((record) => {
    const signalId = `SG-${String(nextId).padStart(4, "0")}`;
    nextId++;

    return {
      id: signalId,
      title: record.title,
      classification: "WATCH",
      source: fileName,
      sourceType: resolvedSourceType,
      summary: record.rawText.slice(0, 400),
      whyItMatters: `Uploaded ${fileType.toUpperCase()} record — awaiting analysis and classification.`,
      confidence: Math.floor(50 + Math.random() * 20),
      tags: ["UPLOADED", fileType.toUpperCase(), resolvedSourceType.toUpperCase()],
      entities: [],
      systemImpact: ["Data Review"],
      engine: "INGEST",
      status: "uploaded",
      rawText: record.rawText,
      timestamp: new Date().toISOString(),
    };
  });

  req.log.info({ count: signals.length, fileName }, "File ingest complete");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `File ingest complete — ${fileName}: ${signals.length} candidates extracted`,
    level: "info",
  });

  res.json(signals);
});

export default router;
