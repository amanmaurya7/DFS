require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()

// Load environment variables
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "2152fe3b234128713d5a44941489c08bce797cf4f9723509a5fd3002b920a9f1"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "YEEUT5DYVH7BMTFBA4K6MVMC4QN4H9ZER4"

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.10" },
      { version: "0.8.20" }
    ]
  },
  networks: {
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
}
