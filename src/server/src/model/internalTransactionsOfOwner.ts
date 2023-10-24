"use strict";

import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";

class InternalTransactionOfOwner extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}
InternalTransactionOfOwner.init(
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
    network: {
      allowNull: false,
      type: DataTypes.INTEGER
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
    methodId: {
      type: DataTypes.INTEGER
    },
    inputs: {
      type: DataTypes.JSON
    },
    raw: {
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
    modelName: "InternalTransactionsOfOwner",
    tableName: "internal_transactions_of_owner"
  }
);

export default InternalTransactionOfOwner;
