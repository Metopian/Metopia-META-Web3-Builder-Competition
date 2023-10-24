import log from '../log';
import Account from '../model/account';
import * as scoreService from '../service/scoreService';

export const select = async ctx => {
  let { owner, credentialId, offset, limit } = ctx.request.query;
  offset = parseInt(offset || 0);
  limit = parseInt(limit || 10000);

  let data = await scoreService.selectScoreList(owner, credentialId, limit, offset)
  return (ctx.body = {
    data: {
      total: data.count,
      offset,
      limit,
      list: data.rows
    },
    auth: ctx.auth,
    code: 0,
    msg: "success"
  });
}

export const selectScoreRankBySpace = async ctx => {
  let { owner, space, offset, limit, } = ctx.request.query;
  offset = parseInt(offset || 0);
  limit = parseInt(limit || 1000);

  let data = space ? await scoreService.selectScoreRankBySpace(space, null, limit, offset) : null
  let my = owner ? await scoreService.selectScoreRankBySpace(space, owner, null, null) : null
  return (ctx.body = {
    data,
    my,
    auth: ctx.auth,
    code: 0,
    msg: "success"
  });
}

export const selectScoreRankBySbt = async ctx => {
  let { owner, sbtId, offset, limit } = ctx.request.query;
  offset = parseInt(offset || 0);
  limit = parseInt(limit || 20);

  let data = sbtId ? await scoreService.selectScoreRankBySbtId(sbtId, null, limit, offset) : null;
  let my = owner ? await scoreService.selectScoreRankBySbtId(sbtId, owner, null, null) : null
  return (ctx.body = {
    data,
    my,
    auth: ctx.auth,
    code: 0,
    msg: "success"
  });
}

export const create = async ctx => {
  let { owner, types, referralCode, network } = ctx.request.body;
  if ((!owner && !referralCode) || !types || !network) {
    return (ctx.body = {
      data: {},
      code: 99,
      msg: "params error, owner|referralCode, types, network must be required"
    });
  }

  if (!owner) {
    const account = await Account.findOne({
      where: { referralCode }
    });
    if (!account) {
      return (ctx.body = {
        data: {},
        code: 99,
        msg: "referralCode error"
      });
    }
    owner = account.get("owner");
  }
  if (typeof types == "string") {
    types = JSON.parse(types);
  }

  let data = [] as any;
  for (let type of types) {
    const score = await scoreService.claimLeaderboardScore(network, owner, type);
    log.info("DING claim log ", JSON.stringify(score))
    if (score) {
      if (type == 5) {
        data = data.concat(score);
      } else {
        data.push(score);
      }
    }
  }

  ctx.body = {
    data,
    auth: ctx.auth,
    code: 0,
    msg: "success"
  };
}

export const selectCountByAchv = async ctx => {
  let { achvIds: str } = ctx.request.query;
  if (!str?.length) {
    return (ctx.body = {
      data: [],
      auth: ctx.auth,
      code: 0,
      msg: "success"
    })
  }
  let achvIds = JSON.parse(str)
  let data = await scoreService.selectScoreCount(achvIds);

  return (ctx.body = {
    data,
    auth: ctx.auth,
    code: 0,
    msg: "success"
  });
}

export const selectIsReferredDataLogged = async ctx => {
  let { owner } = ctx.request.query;
  let data = await scoreService.selectIsReferredDataLogged(owner);

  return (ctx.body = {
    data,
    auth: ctx.auth,
    code: 0,
    msg: "success"
  });
}