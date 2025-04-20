// This script deploys the FileStorage contract to the Polygon Amoy Testnet

const hre = require("hardhat")
const ethers = hre.ethers

async function main() {
  // Get the contract factory
  const FileStorage = await ethers.getContractFactory("FileStorage")

  // Deploy the contract
  console.log("Deploying FileStorage contract...")
  const fileStorage = await FileStorage.deploy()

  // Wait for deployment to finish
  await fileStorage.deployed()

  console.log("FileStorage contract deployed to:", fileStorage.address)
  console.log("Transaction hash:", fileStorage.deployTransaction.hash)

  // Verify the contract on Polygonscan (optional)
  console.log("Waiting for block confirmations...")
  await fileStorage.deployTransaction.wait(5) // Wait for 5 confirmations

  console.log("Verifying contract on Polygonscan...")
  await hre.run("verify:verify", {
    address: fileStorage.address,
    constructorArguments: [],
  })

  console.log("Contract verified on Polygonscan!")
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
