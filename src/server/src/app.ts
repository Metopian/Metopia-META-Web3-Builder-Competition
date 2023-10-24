import cors from "kcors";
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';
import onerror from 'koa-onerror';
import log from "./log";
import metobadgeRouter from "./route/metobadgeRouter";
import ownerRouter from "./route/ownerRouter";
import scoreRouter from "./route/scoreRouter";
import credentialRouter from "./route/credentialRouter";

const app = new Koa()

onerror(app)

app.use(cors());

app.use(bodyparser())

app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  try {
    await next();
  } catch (error: any) {
    log.error(`APP-
      ${JSON.stringify({ error })}-${error.stack}`
    );
    ctx.body = {
      code: 99,
      msg: 'internal error',
      data: {}
    };
    return;
  }
  const ms = new Date().getTime() - start.getTime();
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});


app.use(metobadgeRouter.routes());
app.use(ownerRouter.routes());
app.use(scoreRouter.routes());
app.use(credentialRouter.routes());

app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
