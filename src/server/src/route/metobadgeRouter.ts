import * as metdataController from '../controller/metadataController'
import Router from "koa-router";
const metobadgeRouter = Router();

metobadgeRouter.get("/metadata/:id", metdataController.metadataJson);

export default metobadgeRouter