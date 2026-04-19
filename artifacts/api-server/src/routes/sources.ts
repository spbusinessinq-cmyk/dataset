import { Router, type IRouter } from "express";
import { SOURCES } from "../lib/sourcesConfig";

const router: IRouter = Router();

router.get("/sources", (_req, res): void => {
  res.json(SOURCES);
});

export default router;
