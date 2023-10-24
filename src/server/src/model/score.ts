'use strict';

import { Model, DataTypes } from "sequelize";
import { sequelize } from ".";

class Score extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}
Score.init({
  owner: {
    allowNull: false,
    type: DataTypes.STRING
  },
  network: {
    allowNull: false,
    type: DataTypes.STRING
  },
  type: {
    allowNull: false,
    type: DataTypes.INTEGER
  },
  sbtId: {
    type: DataTypes.INTEGER
  },
  credentialId: {
    type: DataTypes.INTEGER
  },
  score: {
    defaultValue: 0,
    type: DataTypes.INTEGER
  },
  ext: {
    type: DataTypes.STRING(2048)
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
}, {
  sequelize,
  modelName: 'Score',
  tableName: "scores"
});

export default Score

export const SCORE_TYPE_USERNAME = 1;
export const SCORE_TYPE_TWITTER = 2;
export const SCORE_TYPE_DISCORD = 3;
export const SCORE_TYPE_CHECKIN = 4;
export const SCORE_TYPE_INVITE = 7;
export const SCORE_TYPE_CREDENTIAL = 8;