import { Router, type IRouter } from "express";
import crypto from "crypto";
import { fetchFeed } from "../lib/rssParser";
import { getRssSources } from "../lib/sourcesConfig";
import { appendOpsLogEntry } from "../lib/fileStore";

const router: IRouter = Router();

router.get("/ingest/rss", async (req, res): Promise<void> => {
  const sourcesParam = typeof req.query.sources === "string" ? req.query.sources : "";
  const requestedIds = sourcesParam
    ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const rssSources = getRssSources(requestedIds.length > 0 ? requestedIds : undefined);

  req.log.info({ count: rssSources.length }, "RSS ingest started");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `RSS ingest started — ${rssSources.map((s) => s.name).join(", ")}`,
    level: "info",
  });

  const feedResults = await Promise.all(
    rssSources.map((src) =>
      fetchFeed({ url: src.url!, source: src.name, limit: 5 }).then((items) => ({ source: src, items }))
    )
  );

  let candidateIndex = 1;
  const candidates: object[] = [];

  for (const { source, items } of feedResults) {
    for (const item of items) {
      if (!item.title) continue;

      const candidateId = `C-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      candidateIndex++;

      const confidence = Math.floor(60 + Math.random() * 21);

      candidates.push({
        id: candidateId,
        title: item.title.slice(0, 120),
        classification: "WATCH",
        source: source.name,
        sourceType: "News",
        summary: item.description
          ? item.description.slice(0, 400)
          : `Live signal from ${source.name}.`,
        whyItMatters: `Live signal from ${source.name} — requires review and classification.`,
        confidence,
        tags: ["NEWS", "RSS", "LIVE"],
        entities: [],
        systemImpact: ["Monitoring"],
        engine: "INGEST",
        status: "pulled",
        rawText: item.description ? `${item.title}. ${item.description}` : item.title,
        timestamp: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
      });

      void candidateIndex;
    }
  }

  req.log.info({ count: candidates.length }, "RSS ingest complete");

  appendOpsLogEntry({
    id: `log-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    message: `RSS ingest complete — ${candidates.length} candidates returned for queue`,
    level: "info",
  });

  res.json(candidates);
});

export default router;
