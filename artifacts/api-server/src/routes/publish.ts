import { Router, type IRouter } from "express";
import { PublishSignalBody } from "@workspace/api-zod";
import { readPublished, writePublished } from "../lib/fileStore";

const router: IRouter = Router();

router.post("/publish", (req, res): void => {
  const parsed = PublishSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const published = readPublished();
  published.unshift({ ...parsed.data, publishedAt: new Date().toISOString() });
  writePublished(published);

  res.json({ success: true, message: `Signal ${parsed.data.id} published successfully` });
});

export default router;
