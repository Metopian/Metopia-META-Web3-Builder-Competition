'use strict';

import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";
class ScoreLog extends Model {
  static associate(models) {
    // define association here
  }
}
ScoreLog.init({
  owner: {
    type: DataTypes.STRING,
    allowNull: false
  },
  achievementId: {
    defaultValue: 0,
    type: DataTypes.INTEGER
  },
  name: {
    type: DataTypes.STRING
  },
  space: {
    type: DataTypes.STRING
  },
  score: {
    defaultValue: 0,
    type: DataTypes.INTEGER
  },
  value: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'ScoreLog',
  tableName: "scoreLogs"
});

export default ScoreLog
