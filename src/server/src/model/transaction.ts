"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from '.'
class Transaction extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}

Transaction.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    hash: {
      allowNull: false,
      type: DataTypes.STRING
    },
    chain: {
      allowNull: false,
      type: DataTypes.STRING
    },
    token_address: {
      type: DataTypes.STRING
    },
    from_address: {
      allowNull: false,
      type: DataTypes.STRING
    },
    to_address: {
      allowNull: false,
      type: DataTypes.STRING
    },
    value: {
      type: DataTypes.STRING
    },
    gas: {
      type: DataTypes.STRING
    },
    gas_price: {
      type: DataTypes.STRING
    },
    input: {
      type: DataTypes.TEXT
    },
    receipt_status: {
      type: DataTypes.STRING(4)
    },
    block_timestamp: {
      type: DataTypes.DATE
    },
    block_number: {
      type: DataTypes.STRING
    }
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions"
  }
);
export default Transaction