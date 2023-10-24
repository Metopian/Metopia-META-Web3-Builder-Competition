import config from 'config';
import { BigNumber, ethers, utils } from 'ethers';
import { redis } from '../libs/utils';
import * as credentialService from '../service/credentialService';
import * as scoreService from '../service/scoreService';

const sum = (array, keyword?: string, defaultValue?) => {
    return (
        array?.reduce((total, item) => {
            let temp = parseInt(keyword ? item[keyword] : item);
            if (isNaN(temp)) temp = 0;
            return total + (temp || defaultValue);
        }, 0) || 0
    );
};

const getProvider = (chain) => {
    if (chain == 0x89) {
        return new ethers.providers.JsonRpcProvider(
            ""
        );
    } else if (chain == 0x38) {
        return new ethers.providers.JsonRpcProvider(
            ""
        );
    } else if (chain == 0x61) {
        return new ethers.providers.JsonRpcProvider(
            ""
        );
    } else if (chain == 0x2105) {
        return new ethers.providers.JsonRpcProvider(
            ""
        );
    } else if (chain == 0xa4b1) {
        return new ethers.providers.JsonRpcProvider(
            ""
        );
    } else {
        return process.env.NODE_ENV == "development"
            ? new ethers.providers.JsonRpcProvider(
                ""
            )
            : new ethers.providers.JsonRpcProvider(
                ""
            );
    }
};

const queryExpiry = (network, owner, contract) => {
    const provider = getProvider(network);
    const contractObj = new ethers.Contract(contract,
        [{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "expiry",
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
        provider,
    );
    return contractObj.expiry(owner)
}

const queryBalance = async (network, contract, id) => {
    const provider = getProvider(network);
    const contractObj = new ethers.Contract(contract,
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
        provider,
    );
    return (await contractObj.balanceOf(id)).toNumber()
}

export const metadataJson = async (ctx) => {
    const cacheKey = ctx.request.url; // Use the API endpoint URL as the cache key

    try {
        const cachedData = await redis.get(cacheKey); // Check if the data is in cache
        if (cachedData !== null) {
            ctx.body = cachedData; // Return the cached response
            return;
        }
    } catch (error) {
        ctx.throw(error); // Handle errors
    }

    const id = ctx.params.id;
    const owner = utils.getAddress(BigNumber.from(id)?.toHexString() || "0x0");
    let crendentialValues: any = await credentialService.selectCredentialValueByOwner(owner);
    let scores: any = await scoreService.selectScoreList(owner);
    let attrs = [{ trait_type: "level", value: 1 }, { trait_type: "XP", value: sum(scores.rows, "score", 0) },]
    if (crendentialValues.rows) {
        attrs = attrs.concat(crendentialValues.rows?.filter(sc => sc.value)?.map(sc => {
            return {
                trait_type: sc.credentialName, value: sc.value
            }
        }))
    }

    let expiry = await queryExpiry(config.get("officialBadgeNetwork"), owner, config.get("officialBadgeContract"))

    let result = {
        name: "test",
        owner,
        image: `${config.get("leaderboardBadgeImgUrl")}?id=${id}&contract=${config.get("officialBadgeContract")}&network=${config.get("officialBadgeNetwork")}`,
        xp: sum(scores.rows, "score", 0),
        level: 1,
        attributes: attrs,
        expiry: expiry.toString()
    }
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 10);
    return (ctx.body = result)
}