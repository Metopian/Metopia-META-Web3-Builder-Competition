import config from 'config';
import { Op } from 'sequelize';
import { sequelize } from '../model';
import Credential, { ActionSource, ActionSourceParam, ActionSourceType } from "../model/credential";
import CredentialValue from '../model/credentialValue';
import Score, { SCORE_TYPE_CREDENTIAL } from '../model/score';
import { validateGeneralOnchainActions, verifyGeneralOnchainActions } from './credentialValidator/generalOnchainValidator';
import * as transactionService from "./transactionService";

export const selectCredentials = async (id?: number, limit?: number, offset?: number, keyword?: string, categories?: string) => {
    let where = Object.assign({}, id ? { id } : {},
        keyword ? { name: { [Op.like]: `%${keyword}% ` } } : null,
        categories ? { category: { [Op.in]: JSON.stringify(categories) } } : null,
    )

    return Credential.findAndCountAll({ where, limit, offset })
}

export const selectCredentialsByIds = async (ids?: number[]) => {
    if (!ids?.length)
        return null

    return Credential.findAll({ where: { id: { [Op.in]: ids } }, raw: true }) as Promise<any[]>
}

export const updateCredentialValue = async (credentialId: number, owner: string) => {
    let credential = (await Credential.findByPk(credentialId))?.get({ plain: true });
    let sources = credential?.sources as ActionSource[];
    let value = await Promise.all(sources.map(source => calcValue(source.type, source.params, owner))).then(calced => {
        return calced.reduce((sum, curr) => {
            return [sum[0] as number + curr.value, (sum[1] as any[]).concat(curr.txs)]
        }, [0, [] as any[]])
    })
    if (value[0] as number > 0) {
        let curr = (await CredentialValue.findOne({ where: { credentialId, owner } }))?.get({ plain: true })
        if (curr) {
            if (curr.value < value[0]) {
                await CredentialValue.update(
                    { value: value[0], txs: value[1] },
                    {
                        where: {
                            owner, credentialId
                        }
                    }
                );
            }
        } else {
            await sequelize.transaction(t => {
                const network = config.get("officialBadgeNetwork")
                return CredentialValue.create({
                    owner, credentialId, value: value[0], txs: value[1]
                }, { transaction: t })
                    .then(() => {
                        if (credential.score) {
                            return Score.create({
                                owner,
                                type: SCORE_TYPE_CREDENTIAL,
                                score: credential.score,
                                sbtId: config.get("officialBadgeIds")[network],
                                credentialId,
                                network
                            })
                        }
                    })
            }).catch((e) => {
                console.error(e, e.stack)
            })
        }
    }

    return { owner, credentialId, value: value[0], txs: value[1] }
}

export const selectCredentialValueByOwner = async (owner: string, credentialId?: number, limit?: number, offset?: number) => {
    let result = (await CredentialValue.findAndCountAll({ where: credentialId ? { owner, credentialId } : { owner }, limit, offset, order: [["updatedAt", "desc"]] })) as { rows: any[], count: number }
    let credentialIds = result.rows?.filter(sl => sl.credentialId).map(sl => sl.credentialId)
    let credentials = await selectCredentialsByIds(credentialIds)
    return {
        rows: result.rows.map(sc => {
            if (sc.credentialId) {
                return Object.assign(sc, { credentialName: credentials?.find(cre => cre.id == sc.credentialId).name })
            } else {
                return sc
            }
        }),
        count: result.count
    }
}

export const selectCredentialValueByCredential = async (credentialId: number, limit?: number, offset?: number) => {
    let result = (await CredentialValue.findAndCountAll({ where: { credentialId }, limit, offset, order: [["value", "desc"], ["updatedAt", "asc"]] })) as { rows: any[], count: number }
    let credentialIds = result.rows?.filter(sl => sl.credentialId).map(sl => sl.credentialId)
    let credentials = await selectCredentialsByIds(credentialIds)
    return {
        rows: result.rows.map(sc => {
            if (sc.credentialId) {
                return Object.assign(sc, { credentialName: credentials?.find(cre => cre.id == sc.credentialId).name })
            } else {
                return sc
            }
        }),
        count: result.count
    }
}

export async function calcValue(type: ActionSourceType, params: ActionSourceParam[keyof ActionSourceParam], owner: string): Promise<{
    value: number, txs: { hash: string, value?: number }[]
}> {
    let value = 0;
    let txs: { hash: string, value?: number }[] = [];
    let transactions: any[];
    switch (type) {
        case ActionSourceType.SOURCE_ONCHAIN_NEW:
            let { value: localValue, txs: localTxs } = await validateGeneralOnchainActions(params as ActionSourceParam['SOURCE_ONCHAIN_NEW'], owner);
            value += localValue;
            txs = localTxs;
            console.log(params, value, txs)
            break;
        case ActionSourceType.SOURCE_BUNGEE:
            transactions = await transactionService.getTransactionsOfOwner(
                0x2105,
                null,
                config.get("BUNGEE_BASE_ERC20_CONTRACT"),
                null,
                "to",
                0x02d64ed7,
                [
                    {
                        method: "contains",
                        value: owner.substring(2).toLowerCase(),
                        criteria: "input",
                    },
                ]
            );
            value = transactions.length;
            txs = transactions.map(tx => { return { hash: tx.hash } })
            break;

        case ActionSourceType.SOURCE_STARGATE:
            transactions = await transactionService.getTransactionsOfOwner(
                0x2105,
                null,
                config.get("STARGATE_BASE_ERC20_CONTRACT"),
                null,
                "from",
                0x252f7b01,
                [
                    {
                        method: "contains",
                        value: owner.substring(2).toLowerCase(),
                        criteria: "input",
                    },
                ]
            );
            value = transactions.length;
            txs = transactions.map(tx => { return { hash: tx.hash } })
            break;
    }
    return { value, txs };
}

/**
 * @returns valid tx exist 
 */
export const verifyCrendential = async (credentialId: number, owner: string) => {
    let credential = (await Credential.findByPk(credentialId))?.get({ plain: true });
    let sources = credential.sources as ActionSource[];

    const verify = async (type, params) => {
        switch (type) {
            case ActionSourceType.SOURCE_ONCHAIN_NEW:
                return await verifyGeneralOnchainActions(params as ActionSourceParam['SOURCE_ONCHAIN_NEW'], owner);
            default:
                return false;
        }
    }

    let result = await Promise.all(sources.map(source => verify(source.type, source.params))).then(calced => {
        return calced.reduce((res, curr) => {
            return res || curr
        }, false)
    })
    console.log(result)
    return result
}
