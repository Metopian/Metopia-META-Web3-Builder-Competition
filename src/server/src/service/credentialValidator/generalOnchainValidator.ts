import { ethers } from "ethers";
import { ActionSourceParam } from "../../model/credential";
import { getTransactionsOfOwner } from "../transactionService";
import { CredentialValidator } from "./type"

export const validateGeneralOnchainActions: CredentialValidator<'SOURCE_ONCHAIN_NEW'> = async (params, owner) => {
    let value = 0;
    let txs: { hash: string, value?: number }[] = [];
    let methodIds: number[] = []
    if (params.methodId) {
        if (typeof params.methodId == 'object') {
            methodIds = methodIds.concat(params.methodId)
        } else {
            methodIds.push(params.methodId)
        }
    }
    const functions = JSON.parse(params.abi || "[]");
    if (params.abi.length) {
        for (let i = 0; i < functions.length; i++) {
            let func = functions[i];
            const contractInterface = new ethers.utils.Interface([func]);
            const methodId = contractInterface.getSighash(func.name);
            console.log(methodId)
            methodIds.push(parseInt(methodId || "0"))
        }
    }
    if (!methodIds.length) {
        methodIds.push(0)
    }
    let transactions = await getTransactionsOfOwner(
        params.network,
        params.contract,
        owner,
        params.internal,
        params.criteria,
        methodIds,
        params.filters,
        functions
    );

    if (params.type == "count") {
        value += transactions.length;
        txs = transactions.map(tx => { return { hash: tx.hash, value: 1, blocknumber: tx.block_number } })
    } else {
        // TODO
        // handling
    }


    if (params.decimal) {
        value = Math.floor(value / Math.pow(10, params.decimal));
    }

    return { value, txs }
}

export const verifyGeneralOnchainActions = async (params, owner) => {
    let methodIds: number[] = []
    if (params.methodId) {
        if (typeof params.methodId == 'object') {
            methodIds = methodIds.concat(params.methodId)
        } else {
            methodIds.push(params.methodId)
        }
    }
    const functions = JSON.parse(params.abi || "[]");
    if (params.abi.length) {
        for (let i = 0; i < functions.length; i++) {
            let func = functions[i];
            const contractInterface = new ethers.utils.Interface([func]);
            const methodId = contractInterface.getSighash(func.name);
            console.log(methodId)
            methodIds.push(parseInt(methodId || "0"))
        }
    }
    if (!methodIds.length) {
        methodIds.push(0)
    }

    let transactions = await getTransactionsOfOwner(
        params.network,
        params.contract,
        owner,
        params.internal,
        params.criteria,
        methodIds,
        params.filters,
        functions,
        true
    );
    return transactions?.length > 0
}