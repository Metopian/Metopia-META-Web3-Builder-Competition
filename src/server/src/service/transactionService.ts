import moment from "moment";
import { Op } from "sequelize";

import config from "config";
import { ethers } from "ethers";
import { getAbiParamType, invoke, redis, sleep } from "../libs/utils";
import log from '../log';
import InternalTransactionOfOwner from "../model/internalTransactionsOfOwner";
import Transaction from "../model/transaction";
import TransactionOfOwner from "../model/transactionsOfOwner";

export const count = async owner => {
  let result = {};

  for (let key of Object.keys(config.voteAddress)) {
    result[key] = {};
    let { addresses, methods } = config.voteAddress[key];

    for (let method of Object.keys(methods)) {
      let addressesParam = [] as any;
      for (let item of addresses) {
        addressesParam.push({
          chain: item.chain,
          to_address: item.address
        });
      }

      result[key][`${method}_count`] = await Transaction.count({
        where: {
          from_address: owner,
          input: { [Op.like]: `${methods[method]}%` },
          receipt_status: "1",
          [Op.or]: addressesParam
        }
      });
    }
  }

  return result;
};

/**
 * save transaction
 */
async function save(model, result, chain, address) {
  result.chain = chain;
  result.token_address = address;
  result.from_address = result.from_address || result.from;
  result.to_address = result.to_address || result.to;
  result.gas_price = result.gas_price || result.gasPrice;
  result.receipt_status = result.receipt_status || result.txreceipt_status;
  result.block_number = result.block_number || result.blockNumber;
  result.block_timestamp =
    result.block_timestamp || moment.unix(result.timeStamp).format();
  if (result.input.length > 2000) result.input = result.input.slice(0, 1000);

  return await model.create(result);
}

function format(rawTx, network) {
  let tx = Object.assign(rawTx, {
    network,
    from_address: rawTx.from_address || rawTx.from,
    to_address: rawTx.to_address || rawTx.to,
    gas_price: rawTx.gas_price || rawTx.gasPrice,
    receipt_status: rawTx.receipt_status || rawTx.txreceipt_status,
    block_number: rawTx.block_number || rawTx.blockNumber,
    block_timestamp: rawTx.block_timestamp || moment.unix(rawTx.timeStamp).format(),
    inputs: null,
    methodId: rawTx.input.length >= 10 ? parseInt(rawTx.input.substring(0, 10)) : (rawTx.input.length > 2 ? parseInt(rawTx.input) : 0),
    raw: rawTx.input.length > 2000 ? rawTx.input.slice(0, 1000) : rawTx.input
  })
  return tx
}

async function saveBatchTransactionsByOwner(model, list, network) {
  let txs = list.map(raw => format(raw, network))
  await model.bulkCreate(txs, { ignoreDuplicates: true })
}

async function saveBatch(model, list, chain, address) {
  let count = 0;

  // let transaction = await save(model, item, chain, address);
  for (let item of list) {
    if (item.txreceipt_status == "0") continue; //失败的不写入

    let transaction = await model.findOne({
      attributes: ["id"],
      where: {
        chain,
        hash: item.hash
      },
      raw: true
    });
    if (transaction) continue;

    transaction = await save(model, item, chain, address);
    if (transaction) count = count + 1;
  }

  return count;
}


function compareValue(method, value, standardValue) {
  switch (method) {
    case "gte":
      return (value >= standardValue)
    case "gt":
      return (value > standardValue)
    case "lte":
      return (value <= standardValue)
    case "lt":
      return (value < standardValue)
    case "eq":
      return (value == standardValue)
    case "ne":
      return (value != standardValue)
    case "in":
      return (standardValue.find(s => value && s.toLowerCase() == value.toLowerCase()))
    case "has":
      return (value && value.toLowerCase().includes(standardValue.toLowerCase()))
  }

  return false;
}

/**
 * 
 * @param {*} abi object | null
 * @param {*} txs transactions/transactionsOfOwner
 * @param {*} filters 
 * @returns 
 */
const filter = (abi, txs, filters, once?) => {
  if (!filters?.length || !txs) {
    return once && txs?.length ? [txs[0]] : txs
  }
  let result = (once ? txs.find : txs.filter)(tx => {
    let flag = true
    for (let filter of filters) {
      let keywords = filter.criteria.split("-")
      if (keywords[0] == 'input') {
        if (filter.method == 'contains') {
          if ((tx.raw || tx.inputs).indexOf(filter.value) == -1) {
            flag = false
          }
        } else if (abi) {
          const decoder = new ethers.utils.AbiCoder();
          let val = decoder.decode(getAbiParamType(abi), tx.raw || tx.inputs)[parseInt(keywords[1])]
          if (keywords.length > 2) {
            val = val[parseInt(keywords[2])]
          }
          if (filter.decimal) {
            val = val.div(ethers.utils.parseUnits("1", filter.decimal))
          }
          if (!compareValue(filter.method, parseInt(val.toString()), parseInt(filter.value.toString()) || 0)) {
            flag = false
          }
        }
      } else if (keywords[0] == "to" && !compareValue(filter.method, tx.to_address, filter.value)) {
        flag = false
      } else if (keywords[0] == "from" && !compareValue(filter.method, tx.from_address, filter.value)) {
        flag = false
      }
    }

    return flag
  })
  return once ? [result] : result
}

/**
 * abi TODO
 * @param {*} network 
 * @param {*} contract 
 * @param {*} owner 
 * @param {*} internal 
 * @param {*} criteria "from" | "to"
 * @param {*} methodId number, 0 for transfer
 */
export const getTransactionsOfOwner = async (network, contract, owner, internal, criteria, methodId, filters, abi?: object, once?) => {
  const model = internal ? InternalTransactionOfOwner : TransactionOfOwner;
  network = parseInt(network)
  let where = Object.assign({
    network
  }, methodId ? (typeof methodId == 'object' ? { methodId: { [Op.in]: methodId } } : { methodId }) : {},
    criteria == "to" ? { to_address: owner } : (criteria == "fromto" ? { to_address: owner, from_address: owner } : { from_address: owner }),
    contract ? {
      to_address: contract
    } : {},
    filters && filters.find(f => f.method == "contains") ?
      { raw: { [Op.like]: `%${filters.find(f => f.method == "contains").value.toLowerCase()}%` } } : {});
  log.info("getTransactionsOfOwner where", JSON.stringify(where));
  let redisKey = `${JSON.stringify(where)}`;
  let cache = await redis.get(redisKey)
  if (cache) {
    console.log('cache', cache)
    return JSON.parse(cache)
  }

  let txs = await model.findAll({
    where, order: [["block_number", "DESC"]], limit: 1000, raw: true
  });

  txs = filter(abi, txs, filters, once)
  if (txs.length) {
    redis.set(redisKey, JSON.stringify(txs), "EX", 10)
    return txs
  } else {
    await cacheTransactionsByOwner(model, network, owner, internal, criteria == 'to')
    let txs = await model.findAll({
      where, order: [["block_number", "DESC"]], raw: true
    });
    txs = filter(abi, txs, filters, once)
    redis.set(redisKey, JSON.stringify(txs), "EX", 10)
    return txs
  }
}

const waitTillCacheEnd = async (redisKey) => {

  let timeout = 300, // loop 300/30 times/seconds
    count = 0;

  while (await redis.get(redisKey) && count++ < timeout) {
    await sleep(100)
  }
}

export const cacheTransactionsByOwner = async (model, network, owner, internal, isTo) => {
  let redisKey = `${owner}-${internal}`
  if (await redis.get(redisKey)) {
    // if caching, wait till end
    await waitTillCacheEnd(redisKey);
    return
  } else {
    redis.set(redisKey, "1")
  }

  let pageSize = 1000, page = 1, retryCount = 0, result = false;
  network = parseInt(network)

  try {
    let lastTx = await model.findOne({
      where: Object.assign({
        network
      }, isTo ? { to_address: owner } : { from_address: owner }),
      order: [["block_number", "DESC"]]
    });
    let startblock = parseInt((lastTx && lastTx.block_number) || "0")

    const host = config.etherscan.uris[`0x${network.toString(16)}`];
    const apiKey = config.etherscanApiKeys[`0x${network.toString(16)}`];
    while (page) {
      let uri = `${host}?module=account&action=${internal ? "txlistinternal" : "txlist"}&page=${page}&offset=${pageSize}&startblock=${startblock}&endblock=latest&sort=asc&apikey=${apiKey}&address=${owner}`;
      const res = await invoke(
        "GET",
        uri,
        {}
      );

      if (res && res.status == "1") {
        await saveBatchTransactionsByOwner(model, res.result, network);
        if (res.result.length == pageSize) {
          page = page + 1;
          await sleep(100);
        } else {
          page = 0;
          break;
        }
      } else {
        if (res && res.status == "0" && res.message.includes("rate limit") && retryCount <= 2) {
          await sleep(2000);
          retryCount = retryCount + 1;
        } else {
          page = 0;
          break;
        }
      }

      if (page > 10) {
        page = 1;
        startblock = res.result[res.result.length - 1].blockNumber;
      }
    }

    result = true;
  } catch (error) {
    log.error(`transactionsService,cache by owner error,address:${owner},error:${JSON.stringify({ error, stack: (error as any).stack })}`);
  } finally {
    redis.del(redisKey)
  }
  return result;
}


