import Router from "koa-router";
import * as credentialController from "../controller/credentialController";
const credentialRouter = Router();

credentialRouter.prefix("/api/v1/credential")

credentialRouter.get("/", ctx => credentialController.select(ctx, credentialController.SELECT_CREDENTIALS));

credentialRouter.get("/value/ofOwner", ctx => credentialController.select(ctx, credentialController.SELECT_CREDENTIAL_VALUES_OF_OWNER));

credentialRouter.get("/value/ofCredential", ctx => credentialController.select(ctx, credentialController.SELECT_CREDENTIAL_VALUES_OF_CRENDENTIAL));

credentialRouter.post("/value/update", credentialController.updateCredentialValue);

credentialRouter.post("/verify", credentialController.verifyCredentialValue);


export default credentialRouter