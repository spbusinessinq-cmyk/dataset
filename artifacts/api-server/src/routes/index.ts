import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import signalsRouter from "./signals";
import publishRouter from "./publish";
import feedsRouter from "./feeds";
import opslogRouter from "./opslog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(signalsRouter);
router.use(publishRouter);
router.use(feedsRouter);
router.use(opslogRouter);

export default router;
