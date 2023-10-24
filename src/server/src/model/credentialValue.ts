"use strict";
import { Model, DataTypes } from "sequelize";
import { sequelize } from ".";

class CredentialValue extends Model {
    static associate(models) {
        // define association here
    }
}
CredentialValue.init(
    {
        credentialId: {
            type: DataTypes.INTEGER
        },
        owner: {
            type: DataTypes.STRING,
        },
        value: {
            type: DataTypes.BIGINT
        },
        txs: {
            type: DataTypes.ARRAY(DataTypes.JSON)
        }
    },
    {
        sequelize,
        modelName: "CredentialValue",
        tableName: "credentialValue",
    }
);
export default CredentialValue;