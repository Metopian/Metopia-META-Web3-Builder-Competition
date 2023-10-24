import log from "../log";
import moment from "moment";
import { ethers } from "ethers";
import { decodeToken, generateToken, secp256k1Decode } from "../libs/utils";

export const auth_address = async (ctx, next) => {
  const result = await exports.auth(ctx);
  if (!result) {
    return (ctx.body = {
      data: {},
      code: 93,
      msg: "owner address auth failed"
    });
  }

  await next();
};
export const auth = async ctx => {
  const { signature, token } = ctx.header;
  const msg = ctx.header.msg || ctx.request.body.msg;
  const owner = ctx.params.owner || ctx.request.body.owner;
  if (!owner || !(token || (msg && signature))) {
    return false;
  }

  try {
    let decoded;
    if (token) {
      decoded = authToken(token, owner);
    }
    if (decoded) return true;

    if (!msg || !signature) {
      return false;
    }

    const data = JSON.parse(msg);
    if (
      !data.timestamp ||
      moment
        .unix(data.timestamp)
        .add(3, "m")
        .isBefore(moment()) ||
      moment
        .unix(data.timestamp)
        .add(-5, "m")
        .isAfter(moment())
    ) {
      return false;
    }

    if (!data.ownerType || data.ownerType == "0x") {
      const hash = ethers.utils.hashMessage(msg);
      // const hash = await ethers.utils.id(
      //   "\u0019Ethereum Signed Message:\n" + msg.length + msg
      // );
      const pk = ethers.utils.recoverPublicKey(hash, signature);
      const recoveredAddress = ethers.utils.computeAddress(
        ethers.utils.arrayify(pk)
      );

      if (owner.toLowerCase() != recoveredAddress.toLowerCase()) {
        return false;
      }
    }  else if (data.ownerType == "sei") {
      const encodedAddress = secp256k1Decode(msg, signature.slice(0, 64), parseInt(signature.slice(64)));
      if (owner.toLowerCase() != encodedAddress.toLowerCase()) {
        return false;
      }
    } else {
      return false;
    }
  } catch (error: any) {
    log.error(`middleware,auth error,owner:${owner},msg:${msg},
      error:${error.stack}`);
    return false;
  }

  ctx.auth = generateToken(owner);
  ctx.owner = owner;

  return true;
}

async function authToken(token, owner) {
  let tokenBody;
  try {
    tokenBody = decodeToken(token);
  } catch (error) { }

  if (!tokenBody || tokenBody.owner.toLowerCase() != owner.toLowerCase()) {
    return false;
  }

  return true;
}

export const auth_secret = async (ctx, next) => {
  const result = await exports.auth_sbt(ctx);
  if (!result) {
    return (ctx.body = {
      data: {},
      code: 93,
      msg: "space secret auth failed"
    });
  }

  await next();
};

