import config from "config";

const genera = require("nanoid/generate");
const request = require("request-promise");
const fs = require("fs");
const path = require("path");
// const sharp = require('sharp');

import { ethers } from 'ethers';
import moment from "moment";
import log from '../log';
import redis from "./redis";

const jwt = require("jsonwebtoken");
const secp256k1 = require('secp256k1')
const crypto = require("crypto");
const { bech32 } = require('bech32');
const ripemd160 = require('ripemd160');
const { Wallet } = require('@ethersproject/wallet');
const { SeiCosmWasmClient } = require("@sei-js/core");


function getRandomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getRandomSeiRpcUrl = (chainId) => {
  const _rpcEndpoints = config.sei_rpc_endpoints[chainId];
  if (!_rpcEndpoints || !_rpcEndpoints.length)
    return null;
  const rpcEndpoint = _rpcEndpoints[getRandomInteger(0, _rpcEndpoints.length - 1)]
  return rpcEndpoint
}
exports.getRandomSeiRpcUrl = getRandomSeiRpcUrl

export const getAbiParamType = (abi) => {
  return abi.inputs.map((input) => {
    if (input.type == 'tuple') {
      return `tuple(${input.components.map(c => c.type).join(",")})`
    } else input.type
  })
}
exports.getAbiParamType = getAbiParamType;

export const DefaultResponse = (data) => {
  return {
    data,
    code: 0,
    msg: "success"
  }
}
export const DefaultError = (msg, code?) => {
  return {
    data: {},
    code: code || 99,
    msg
  }
}
exports.DefaultError = DefaultError;


export const sleep = async time => {
  return new Promise(resolve => { setTimeout(resolve, time) })
}
exports.sleep = sleep

export const invoke = async (method, uri, body?, header?) => {
  try {
    return await request({
      method,
      uri,
      rejectUnauthorized: false,
      body,
      timeout: 60000, //1min
      headers: Object.assign(
        {
          "Content-Type": "application/json;charset=UTF-8"
        },
        header
      ),
      json: true
    });
  } catch (error) {
    log.error(`libs utils,invoke error,uri:${uri},body:${body},error:${error}`);
  }
};
exports.invoke = invoke;

export const invokeForm = async (method, uri, form, header = {}) => {
  try {
    let res = await request({
      method,
      uri,
      rejectUnauthorized: false,
      form,
      timeout: 60000, //1min
      headers: Object.assign(
        {
          "Content-Type": "application/json;charset=UTF-8",
          "accept": "application/json"
        },
        header
      )
    });

    return JSON.parse(res);
  } catch (error) {
    log.error(`libs utils,invoke error,uri:${uri},form:${form},error:${error}`);
  }
};
exports.invokeForm = invokeForm

export const discordInvoke = async (method, endpoint, form, header = {}, owner = null) => {
  const uri = `https://discord.com/api/v8${endpoint}`;

  try {
    let res = await request({
      method,
      uri,
      form,
      headers: Object.assign(
        {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        header
      )
    });

    return JSON.parse(res);
  } catch (error) {
    log.error(`libs utils,discordInvoke error,endpoint:${endpoint},form:${form},error:${error}`);
    if ((error as any).stack.includes("401") && owner) {
      await redis.del(`discord-auth-token-expire-${owner}`);

      return 401;
    }
  }
}
exports.discordInvoke = discordInvoke

export const mkdirsSync = (folderPath, model) => {
  if (!fs.existsSync(folderPath)) {
    (this as any).mkdirsSync(path.dirname(folderPath), model);
    fs.mkdirSync(folderPath, model);
  }
};
exports.mkdirsSync = mkdirsSync;

export const nanoid = (num = 6, randomString = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
  return genera(randomString, num);
};
exports.nanoid = nanoid;

export const generateToken = owner => {
  const expireAt = moment().add(config.get("tokenExpireTime"), "s").unix();
  const token = jwt.sign({
    owner,
    exp: expireAt + 60
  }, config.get("jwtTokenSecret"));

  return {
    token,
    expireAt
  }
};
exports.generateToken = generateToken;

export const decodeToken = token => {
  return jwt.verify(token, config.get("jwtTokenSecret"));
};
exports.decodeToken = decodeToken;

export const ethSign = async (msg) => {
  const wallet = new Wallet(config.wallet.privateKey);
  return await wallet.signMessage(ethers.utils.arrayify(msg));
}
exports.ethSign = ethSign;

export const secp256k1Sign = (msg) => {
  // Create a message to sign
  const message = Buffer.from(msg, 'utf8');

  const messageHash = crypto.createHash('sha256').update(message).digest();

  const privateKeyBuffer = Buffer.from(config.wallet.seiPrivateKey, 'hex');
  const { signature, recid } = secp256k1.ecdsaSign(messageHash, privateKeyBuffer);
  const hexString = Array.from(signature).map(b => (b as any).toString(16).padStart(2, '0')).join('');

  return { hexString, recid };
}
exports.secp256k1Sign = secp256k1Sign;

export const secp256k1Decode = (msg, hexString, recid) => {
  const message = Buffer.from(msg, 'utf8');

  const messageHash = crypto.createHash('sha256').update(message).digest();

  const sigBuffer = Buffer.from(hexString, 'hex');
  const publicKey = secp256k1.ecdsaRecover(new Uint8Array(sigBuffer), recid, messageHash, true);
  const sha256Hash = crypto.createHash('sha256').update(Buffer.from(publicKey, 'hex')).digest();
  const ripeMd160Hash = new ripemd160().update(sha256Hash).digest();
  const words = bech32.toWords(Buffer.from(ripeMd160Hash, 'hex'));
  const hrp = 'sei';
  const encodedAddress = bech32.encode(hrp, words);

  return encodedAddress;
}
exports.secp256k1Decode = secp256k1Decode;

export const queryCosmToken = async (chainId, contract, owner) => {
  const _rpcEndpoints = config.sei_rpc_endpoints[chainId];
  const rpcEndpoint = _rpcEndpoints[getRandomInteger(0, _rpcEndpoints.length - 1)]
  let cosmWasmClient = await SeiCosmWasmClient.connect(rpcEndpoint);
  let result;
  try {
    result = await cosmWasmClient.queryContractSmart(contract,
      {
        nft_info: { token_id: owner },
      }
    );
  } catch (err) { }

  return result;
}
exports.queryToken = queryCosmToken;


exports.clearRediskeys = async (filter) => {
  let res = await redis.get("twitter-followed-cache-1576074699461005312")
  if (res) res = JSON.parse(res)
  console.log("res:", res)
}

export { redis };

export const getProvider = (chain) => {
  if (chain == 0x89) {
    return new ethers.providers.StaticJsonRpcProvider(
      "https://damp-ultra-cherry.matic.quiknode.pro/ea613c3695241939749b11ae7efede038aa50152/"
    );

  } else if (chain == 0x38) {
    return new ethers.providers.StaticJsonRpcProvider(
      "https://polished-dawn-research.bsc.quiknode.pro/00e87ad609448ea0a3635f69bf98c695b938f9fb/"
    );
  } else if (chain == 0x61) {
    return new ethers.providers.JsonRpcProvider(
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    );
  } else if (chain == 0x2105) {
    return new ethers.providers.StaticJsonRpcProvider(
      "https://lingering-virulent-dinghy.base-mainnet.quiknode.pro/057afecb0d9a981657fec3c0bf94f0bd5075b8fc/"
    );
  } else if (chain == 0xa4b1) {
    return new ethers.providers.StaticJsonRpcProvider(
      "https://purple-wider-card.arbitrum-mainnet.quiknode.pro/9194c209a75d6fd67403bc33b1278dc407841a4f"
    );
  } else {
    return process.env.NODE_ENV == "development"
      ? new ethers.providers.StaticJsonRpcProvider(
        "https://data-seed-prebsc-1-s1.binance.org:8545/"
      )
      : new ethers.providers.StaticJsonRpcProvider(
        "https://bsc-dataseed1.binance.org:443"
      );
  }
};
