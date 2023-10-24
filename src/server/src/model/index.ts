"use strict";


import config from "config";
import { DataTypes, Sequelize } from "sequelize";
import log from '../log';
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);
const dbConfig = config.get("db");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    benchmark: true,
    logging: (sqlLogText, costMs, options) => {
      const { bizName } = options;
      if (costMs >= config.get("slowSqlMillis")) {
        log.warn(`${sqlLogText},${costMs}ms,${bizName}`);
      } else if (bizName) {
        log.debug(`${sqlLogText},${costMs}ms,${bizName}`);
      } else {
        log.debug(`${sqlLogText},${costMs}ms`);
      }
    },
  }
);

const db = { sequelize, Sequelize };

// const models = [
//   ""
// ]
const models = [
  "Account",
  "AccountGuild",
  "Achievement",
  "AchievementData",
  "Activity",
  "Agent",
  "Audit",
  "ClaimAchievementLog",
  "Contract",
  "Delegate",
  "DelegationEvent",
  "Draft",
  "EmailSubcription",
  "Erc20Transfer",
  "Event",
  "Event2",
  "Follow",
  "GuildRole",
  "InternalTransactionsOfOwner",
  "Nft",
  "Notification",
  "Player",
  "QuestCollections",
  "Sbt",
  "SbtSig",
  "SbtToken",
  "SbtTokenAchievement",
  "SbtUpdateLog",
  "Score",
  "ScoreLog",
  "Space",
  "SpaceSecret",
  "SpaceVerified",
  "Transaction",
  "TransactionsOfOwner",
  "Transfer",
  "User",
  "VoteComment",
  "Whitelist",
];

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    try {
      let model = require(path.join(__dirname, file))(
        sequelize,
        DataTypes
      );
      db[model.name] = model;
    } catch (e) { }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
export { Sequelize, sequelize };
// const a= {...db}
// export { sequelize, Sequelize, ...db };
