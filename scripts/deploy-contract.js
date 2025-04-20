// Import required libraries
import 'dotenv/config'
import { ethers } from "ethers"
import fs from "fs"

async function main() {
  console.log("Starting deployment to Polygon Amoy Testnet...")

  // Connect to the Polygon Amoy Testnet
  const provider = new ethers.providers.JsonRpcProvider(process.env.AMOY_RPC_URL)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  console.log(`Connected to Polygon Amoy Testnet with address: ${wallet.address}`)

  // Get wallet balance to ensure we have funds
  const balance = await wallet.getBalance()
  console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} POL`)

  if (balance.eq(0)) {
    console.error("Error: Wallet has 0 POL. Please fund your wallet from the Polygon Amoy faucet.")
    process.exit(1)
  }

  // Read the compiled contract
  const contractJson = JSON.parse(fs.readFileSync("./artifacts/contracts/FileStorage.sol/FileStorage.json", "utf8"))
  const contractAbi = contractJson.abi
  const contractBytecode = contractJson.bytecode

  // Create contract factory
  const contractFactory = new ethers.ContractFactory(contractAbi, contractBytecode, wallet)

  // Deploy the contract
  console.log("Deploying FileStorage contract...")
  const contract = await contractFactory.deploy()

  console.log(`Transaction hash: ${contract.deployTransaction.hash}`)
  console.log("Waiting for confirmation...")

  // Wait for the contract to be deployed
  await contract.deployed()

  console.log(`Contract deployed successfully at address: ${contract.address}`)

  // Save the contract address and ABI to a file for easy access
  const deployData = {
    address: contract.address,
    abi: contractAbi,
    network: "polygon-amoy",
    deployedAt: new Date().toISOString(),
  }

  fs.writeFileSync("./contract-deploy.json", JSON.stringify(deployData, null, 2))
  console.log("Deployment data saved to contract-deploy.json")

  // Verify the contract on Polygonscan (optional)
  console.log("\nTo verify the contract on Polygonscan, run:")
  console.log(`npx hardhat verify --network amoy ${contract.address}`)

  return contract.address
}

main()
  .then((address) => {
    console.log(`\nDeployment complete! Contract address: ${address}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Deployment failed:", error)
    process.exit(1)
  })
