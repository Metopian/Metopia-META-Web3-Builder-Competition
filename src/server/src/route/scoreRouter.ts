import Router from "koa-router";
import * as scoreController from '../controller/scoreController';
const scoreRouter = Router()

scoreRouter.prefix("/api/v1/scores");

scoreRouter.get("/select", scoreController.select);

scoreRouter.post("/", scoreController.create);

scoreRouter.get("/select/rankBySpace", scoreController.selectScoreRankBySpace);
scoreRouter.get("/select/rankBySbt", scoreController.selectScoreRankBySbt);

scoreRouter.get("/select/count", scoreController.selectCountByAchv);

scoreRouter.get("/select/isReferralLogged", scoreController.selectIsReferredDataLogged);
export default scoreRouter