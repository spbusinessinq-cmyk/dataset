import { Router, type IRouter } from "express";
import { readFeeds } from "../lib/fileStore";

const router: IRouter = Router();

router.get("/feeds", (_req, res): void => {
  const feeds = readFeeds();
  res.json(feeds);
});

export default router;
