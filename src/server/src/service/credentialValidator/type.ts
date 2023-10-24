import { ActionSourceParam, ActionSourceType } from "../../model/credential"

export declare type CredentialValidator<T extends keyof ActionSourceParam> = (
    params: ActionSourceParam[T], owner: string
) => Promise<{ value: number, txs: { hash: string, value?: number }[] }>