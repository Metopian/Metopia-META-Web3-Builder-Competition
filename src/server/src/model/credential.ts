"use strict";
import { Model, DataTypes } from "sequelize";
import { sequelize } from ".";

class Credential extends Model { }
Credential.init(
    {
        name: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        sources: {
            type: DataTypes.ARRAY(DataTypes.JSON),
        },
        icon: {
            type: DataTypes.STRING,
        },
        link: {
            type: DataTypes.STRING,
        },
        category: {
            type: DataTypes.STRING,
        },
        project: {
            type: DataTypes.STRING,
        },
        eligibility: {
            type: DataTypes.STRING,
        },
        questCollectionId: {
            type: DataTypes.INTEGER
        },
        score: {
            type: DataTypes.INTEGER
        }
    },
    {
        sequelize,
        modelName: "Credential",
        tableName: "credential",
    }
);
export default Credential;

export enum ActionSourceType {
    SOURCE_ONCHAIN_NEW = 17,
    SOURCE_BUNGEE = 18,
    SOURCE_STARGATE = 19
}

export declare type ActionSourceParam = {
    SOURCE_ONCHAIN_NEW: {
        abi: string,
        methodId?: number,
        contract: string,
        network: number,
        criteria: string, //"from" | "to" | "topic::"+number | "eventdata::" + number | "input::" + number,
        type: "volume" | "count",
        target?: string, //"topic::" + number | "eventdata::" + number | "input::" + number,
        decimal?: number
        filters: [{
            criteria: string, // "blocknumber" | "from" | "to" | "topic::" + number | "eventdata::" + number | "input::" + number,
            method: "gte" | "gt" | "eq" | "lte" | "lt",
            value: number,
            type: "address" | "number",
            decimal?: number
        }],
        internal?: boolean
    };
    SOURCE_BUNGEE: {
        methodId?: number,
        contract: string
    },
    SOURCE_STARGATE: {
        methodId?: number,
        contract: string
    },
    ALGORITHM_BORA_CLOSE: {

    }
};

export declare type ActionSource = {
    type: ActionSourceType;
    weight?: number;
    params: ActionSourceParam[];
}

