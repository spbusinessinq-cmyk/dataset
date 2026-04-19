import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import signalsRouter from "./signals";
import publishRouter from "./publish";
import feedsRouter from "./feeds";
import opslogRouter from "./opslog";
import ingestRouter from "./ingest";
import ingestAllRouter from "./ingestAll";
import fileIngestRouter from "./fileIngest";
import sourcesRouter from "./sources";
import statusRouter from "./status";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(signalsRouter);
router.use(publishRouter);
router.use(feedsRouter);
router.use(opslogRouter);
router.use(ingestRouter);
router.use(ingestAllRouter);
router.use(fileIngestRouter);
router.use(sourcesRouter);
router.use(statusRouter);

export default router;
