import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Step 1: Deploy Fee Recipient (temporary — deployer)
  const feeRecipient = deployer.address;

  // Step 2: Deploy Migrator (temporary DEX router — deployer address as placeholder)
  const mockDexRouter = deployer.address;
  const mockWeth = deployer.address;

  const Migrator = await ethers.getContractFactory("OPNChiaMigrator");
  const migrator = await Migrator.deploy(deployer.address, mockDexRouter, mockWeth, feeRecipient);
  await migrator.waitForDeployment();
  console.log("Migrator deployed to:", await migrator.getAddress());

  // Step 3: Deploy Factory
  const Factory = await ethers.getContractFactory("OPNChiaFactory");
  const factory = await Factory.deploy(
    await migrator.getAddress(),
    feeRecipient,
    ethers.parseEther("0.01") // 0.01 IOPN creation fee
  );
  await factory.waitForDeployment();
  console.log("Factory deployed to:", await factory.getAddress());

  // Step 4: Update migrator with factory address
  // (In production, use a proper ownership pattern)

  console.log("\n=== Deployment Complete ===");
  console.log("Factory:", await factory.getAddress());
  console.log("Migrator:", await migrator.getAddress());

  // Save deployment addresses
  const fs = require("fs");
  const deployment = {
    network: "opnTestnet",
    factory: await factory.getAddress(),
    migrator: await migrator.getAddress(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync("deployment.json", JSON.stringify(deployment, null, 2));
  console.log("Deployment saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
