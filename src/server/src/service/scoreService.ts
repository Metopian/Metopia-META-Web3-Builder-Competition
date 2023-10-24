
import config from 'config';
import { ethers } from "ethers";
import moment from "moment";
import { Op } from "sequelize";
import log from '../log';
import { sequelize } from "../model";
import Account from "../model/account";
import Score, { SCORE_TYPE_INVITE } from "../model/score";
import ScoreLog from "../model/scorelog";
import AccountService from "./accountService";
import { selectCredentialsByIds } from './credentialService';

export const selectAchievementDataByOwner = async (owner, achievementId,) => {
	let where = {
		owner,
		achievementId
	}

	let score = (await ScoreLog.findOne({ where }))?.get({ plain: true })
	return { score: score?.score, value: score?.value }
}

export const selectScoreRankBySbtId = async (sbtId?, owner?, limit?, offset?) => {
	if (!sbtId && !owner)
		return null
	let whereClause = `1=1 ${sbtId ? `and sbtId=${sbtId}` : ""} ${owner ? `and owner="${owner}"` : ""}`
	let [result] = await sequelize.query(`select * from sbt_score_rankings_ where ${whereClause} ${limit ? `limit ${offset || 0},${limit}` : ""}`, {
		raw: true
	});
	return result
}

export const selectScoreRankBySpace = async (space?, owner?, limit?, offset?) => {
	if (!space && !owner)
		return null

	let whereClause = `1=1 ${space ? `and space=${space}` : ""} ${owner ? `and owner="${owner}"` : ""}`
	let [result] = await sequelize.query(`select * from space_score_rankings_ where ${whereClause} ${limit ? `limit ${offset || 0},${limit}` : ""}`, {
		raw: true
	});
	return result
}

export const selectScoreList = async (owner, credentialId?, limit?, offset?) => {
	let scores = (await Score.findAndCountAll({
		where: Object.assign({}, owner ? { owner } : {},
			credentialId ? { credentialId } : null), raw: true,
		limit: limit ? parseInt(limit) : 10000, offset: offset && parseInt(offset) || 0
	})) as { rows: any[], count: number }
	let credentialIds = scores.rows?.filter(sl => sl.credentialId).map(sl => sl.credentialId)
	let credentials = await selectCredentialsByIds(credentialIds)

	return {
		rows: scores.rows.map(sc => {
			if (sc.credentialId) {
				return Object.assign(sc, { credentialName: credentials?.find(cre => cre.id == sc.credentialId).name })
			} else {
				return sc
			}
		}),
		count: scores.count
	}

}

// ???
export const selectScoreCount = async (achvIds) => {
	let where = {
		achievementId: { [Op.in]: achvIds }
	}
	return ScoreLog.findAll({
		attributes: [[sequelize.fn('COUNT', sequelize.col('*')), 'count'], "achievementId"],
		where, group: "achievementId"
	})
}

const getProvider = (chain) => {
	if (chain == 0x89) {
		return new ethers.providers.JsonRpcProvider(
			"https://damp-ultra-cherry.matic.quiknode.pro/ea613c3695241939749b11ae7efede038aa50152/"
		);
	} else if (chain == 0x38) {
		return new ethers.providers.JsonRpcProvider(
			"https://polished-dawn-research.bsc.quiknode.pro/00e87ad609448ea0a3635f69bf98c695b938f9fb/"
		);
	} else if (chain == 0x61) {
		return new ethers.providers.JsonRpcProvider(
			"https://data-seed-prebsc-1-s1.binance.org:8545/"
		);
	} else if (chain == 0x2105) {
		return new ethers.providers.JsonRpcProvider(
			"https://lingering-virulent-dinghy.base-mainnet.quiknode.pro/057afecb0d9a981657fec3c0bf94f0bd5075b8fc/"
		);
	} else if (chain == 0xa4b1) {
		return new ethers.providers.JsonRpcProvider(
			"https://purple-wider-card.arbitrum-mainnet.quiknode.pro/9194c209a75d6fd67403bc33b1278dc407841a4f"
		);
	} else {
		return process.env.NODE_ENV == "development"
			? new ethers.providers.JsonRpcProvider(
				"https://data-seed-prebsc-1-s1.binance.org:8545/"
			)
			: new ethers.providers.JsonRpcProvider(
				"https://bsc-dataseed1.binance.org:443"
			);
	}
};

export const claimLeaderboardScore = async (network, owner, type) => {
	let result;
	try {
		let account = (await Account.findOne({
			where: { owner }
		}))?.get({ plain: true });

		if (type == SCORE_TYPE_INVITE) {
			let ownerAccount = (await AccountService.selectAccountByOwner(owner))?.get({ plain: true });
			if (!ownerAccount?.referral) {
				return null
			}
			let referralAccount = await AccountService.selectAccountByOwner(ownerAccount?.referral)
			if (!referralAccount) {
				return null
			}
			const contract = new ethers.Contract(
				config.get("officialBadgeContract"),
				[{
					"inputs": [
						{
							"internalType": "address",
							"name": "owner",
							"type": "address"
						}
					],
					"name": "balanceOf",
					"outputs": [
						{
							"internalType": "uint256",
							"name": "",
							"type": "uint256"
						}
					],
					"stateMutability": "view",
					"type": "function"
				}],
				getProvider(network)
			);
			let balance = parseInt((await contract.balanceOf(owner)).toString())
			if (!balance) {
				return null
			} else {
				if (!await selectIsReferredDataLogged(owner)) {
					if (owner.indexOf("sei") == 0) {
						throw Error("reject")
					}
					result = await Score.create({
						owner: referralAccount.get("owner"),
						type,
						score: config.enums.score.find(s => s.type == type).score,
						ext: owner,
						createdAt: new Date().getTime(),
						sbtId: config.get("officialBadgeIds")[network],
						network
					})
				}
			}
		} else {
			let isValid = await valid(network, account, type);

			if (isValid) {
				if (owner.indexOf("sei") == 0) {
					throw Error("reject")
				}
				result = await Score.create({
					owner,
					type,
					sbtId: config.get("officialBadgeIds")[network],
					score: config.enums.score.find(s => s.type == type).score,
					network
				});
			}
		}
	} catch (error) {
		result = null;
		log.error(`scoresService,claim error,error:${(error as Error).stack}`);
	}

	return result;
}

async function valid(network, account, type) {
	let score;

	switch (type) {
		// username
		case 1:
			if (!account || !account.username) break;

			score = await Score.findOne({
				where: {
					owner: account.owner,
					type,
					network
				}
			});
			if (score) break;

			return true;
		// twitterUserId
		case 2:
			if (!account || !account.twitterUserId || account.twitterUserId == "0") break;

			score = await Score.findOne({
				where: {
					owner: account.owner,
					type,
					network
				}
			});
			if (score) break;

			return true;
		// discordId
		case 3:
			if (!account || !account.discordId || account.discordId == "0") break;

			score = await Score.findOne({
				where: {
					owner: account.owner,
					type,
					network
				}
			});
			if (score) break;

			return true;
		case 4:
			score = await Score.findOne({
				where: {
					owner: account.owner,
					type,
					network,
					createdAt: {
						[Op.gte]: moment().startOf("d").format()
					}
				}
			});

			if (score) break;

			return true;
		case 6:
			// TODO claimed special badge ?
			// if (没有claim) break;
			return true;
		default:
			log.info(`DING, claim scores failed hit:`, `-${type}-`);
	}

	return false;
}

const referredOwners = {}
export const selectIsReferredDataLogged = async (owner) => {
	if (referredOwners[owner])
		return referredOwners[owner]
	else {
		let res = await Score.findOne({ where: { ext: owner } })
		if (res) {
			referredOwners[owner] = res.get("owner")
			return referredOwners[owner]
		}
	}
}