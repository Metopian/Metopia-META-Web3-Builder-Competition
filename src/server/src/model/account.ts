"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from '.'
class Account extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}
Account.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    owner: {
      allowNull: false,
      type: DataTypes.STRING,
      unique: true
    },
    ownerType: {
      defaultValue: "0x",
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING
    },
    avatar: {
      type: DataTypes.JSON
    },
    introduction: {
      type: DataTypes.TEXT
    },
    discordId: {
      defaultValue: "0",
      type: DataTypes.STRING
    },
    discordName: {
      type: DataTypes.STRING
    },
    discordDiscrim: {
      type: DataTypes.STRING
    },
    discordAvatar: {
      type: DataTypes.STRING
    },
    twitterUserId: {
      defaultValue: "0",
      type: DataTypes.STRING
    },
    twitterScreenName: {
      type: DataTypes.STRING
    },
    referralCode: {
      type: DataTypes.STRING
    },
    referral: {
      type: DataTypes.STRING
    },
    banner: {
      type: DataTypes.STRING(2048)
    },
    score: {
      defaultValue: 0,
      type: DataTypes.INTEGER
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
  // hooks: {
  //   beforeSave: (account, options) => {
  //     account.referralCode = account.referralCode || utils.nanoid();
  //   }
  // },
  sequelize,
  modelName: "Account",
  tableName: "accounts"
});

export default Account