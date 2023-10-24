import Router from "koa-router";
import * as ownerController from "../controller/ownerController";
import { auth_address } from "../middleware";
const ownerRouter = Router();

ownerRouter.prefix("/api/v1/owners");


ownerRouter.post("/", auth_address, ownerController.create);

ownerRouter.get("/:owner", ownerController.show);

ownerRouter.get("/", ownerController.index);

ownerRouter.put("/:owner", auth_address, ownerController.update);
export default ownerRouter