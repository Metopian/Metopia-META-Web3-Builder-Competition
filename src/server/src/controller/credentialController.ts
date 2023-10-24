import { DefaultResponse } from "../libs/utils";
import * as credentialService from "../service/credentialService";

export const SELECT_CREDENTIALS = 1;
export const SELECT_CREDENTIAL_VALUES_OF_OWNER = 2;
export const SELECT_CREDENTIAL_VALUES_OF_CRENDENTIAL = 3;
export const select = async (ctx, selectType) => {
    let { owner, credentialId, limit, offset, keyword, categories } = ctx.request.query;
    let data;
    limit = parseInt(limit || 100)
    offset = parseInt(offset || 0)
    switch (selectType) {
        case SELECT_CREDENTIALS:
            data = await credentialService.selectCredentials(credentialId, limit, offset);
            break;
        case SELECT_CREDENTIAL_VALUES_OF_OWNER:
            data = await credentialService.selectCredentialValueByOwner(owner, credentialId, limit, offset);
            break;
        case SELECT_CREDENTIAL_VALUES_OF_CRENDENTIAL:
            data = await credentialService.selectCredentialValueByCredential(credentialId, limit, offset);
            break;
        default:
            data = {}
    }

    ctx.body = DefaultResponse({
        total: data.count,
        offset,
        limit,
        list: data.rows
    });
}

export const updateCredentialValue = async (ctx) => {
    let { owner, credentialId } = ctx.request.body;
    let data = await credentialService.updateCredentialValue(credentialId, owner)
    ctx.body = DefaultResponse(data)

}
export const verifyCredentialValue = async (ctx) => {
    let { owner, credentialId } = ctx.request.body;
    let flag = await credentialService.verifyCrendential(credentialId, owner)
    ctx.body = DefaultResponse({ result: flag })
}