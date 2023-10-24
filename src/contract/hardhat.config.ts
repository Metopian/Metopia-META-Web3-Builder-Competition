import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: [
        {
          privateKey: (process.env.PRIVATE_KEY || "").toString(), // Load from env variable
          balance: "10000000000000000000",
        },
      ],
    },
    bscTestnet: {
      url: "",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 120000,
    },
    bsc: {
      url: "",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 120000,
    },
    matic: {
      url: "",
      chainId: 137,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 120000,
    },
    base: {
      url: "",
      chainId: 8453,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 120000,
    },
  },
  etherscan: {
    // Basescan
    // apiKey: { base: "" },
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com/",
        },
      }, {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com/",
        },
      }, {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://basescan.io/api",
          browserURL: "https://basescan.io",
        },
      },
    ],
    /**
     * BSC
     */
    apiKey: ""

    /**
     * Polygon
     */
    // apiKey: "",
  },
};

export default config;
