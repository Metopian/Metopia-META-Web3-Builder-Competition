import { Op } from 'sequelize';
import { nanoid } from '../libs/utils';
import Account from '../model/account';

import log from '../log';

export const show = async ctx => {
  const owner = ctx.params.owner;

  let account = await Account.findOne({
    where: { owner }
  });

  ctx.body = {
    data: account || {},
    auth: ctx.auth,
    code: account ? 0 : 90,
    msg: account ? "success" : "Not found!"
  };
};

export const index = async ctx => {
  let { owners, referralCode, offset, limit } = ctx.request.query;
  offset = parseInt(offset || 0);
  limit = parseInt(limit || 200);

  let where = {} as any;
  if (owners && owners.length > 0) {
    where.owner = { [Op.in]: owners };
  }
  if (referralCode) {
    where.referralCode = referralCode;
  }
  let data = await Account.findAndCountAll({
    where,
    offset,
    limit,
    order: [["createdAt", "DESC"]]
  });

  ctx.body = {
    data: {
      total: data.count,
      offset,
      limit,
      list: data.rows
    },
    auth: ctx.auth,
    code: 0,
    msg: "success"
  };
};

export const create = async ctx => {
  let params = ctx.request.body;
  if (!params.owner) {
    return (ctx.body = {
      data: {},
      code: 99,
      msg: "params error, owner must be required"
    });
  }

  let account;
  try {
    if (params.referral && params.referral.length == 6) {
      const referralAccount = (await Account.findOne({
        attributes: ["owner"],
        where: {
          referralCode: params.referral
        },
        // raw: true
      }))?.get({ plain: true });
      if (referralAccount) params.referral = referralAccount.owner;
    }
    params.referralCode = nanoid()
    account = await Account.create(params);
  } catch (error) {
    log.error(`ownersController,create error,method:${ctx.method},url:${ctx.url
      },
      error:${JSON.stringify({ error, stack: (error as Error).stack })}`);
  }

  ctx.body = {
    data: account || {},
    auth: ctx.auth,
    code: account ? 0 : 98,
    msg: account ? "success" : "Something went wrong!"
  };
};

export const createSei = async ctx => {
  const owner = ctx.params.owner;
  if (owner.indexOf("sei") != 0) {
    return (ctx.body = {
      data: {},
      code: 400,
      msg: "Not Sei"
    });
  }
  return await exports.create(ctx)
}

export const update = async ctx => {
  const owner = ctx.params.owner;
  let params = ctx.request.body;

  let account = await Account.findOne({
    where: { owner }
  });
  if (account) {
    try {
      if (params.referral) {
        delete params.referral;
      }
      account = await account.update(params);
    } catch (error) {
      log.error(`ownersController,update error,method:${ctx.method},url:${ctx.url
        },
        error:${JSON.stringify({ error, stack: (error as Error).stack })}`);
      return (ctx.body = {
        data: {},
        code: 98,
        msg: "Something went wrong!"
      });
    }
  }

  ctx.body = {
    data: account || {},
    auth: ctx.auth,
    code: account ? 0 : 98,
    msg: account ? "success" : "Something went wrong!"
  };
};

export const updateSei = async ctx => {
  const owner = ctx.params.owner;
  if (owner.indexOf("sei") != 0) {
    return (ctx.body = {
      data: {},
      code: 400,
      msg: "Not Sei"
    });
  }
  return await exports.update(ctx)
}

