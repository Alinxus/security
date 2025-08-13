const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Transaction Firewall contracts...");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy SecurityRegistry first
  console.log("\n📊 Deploying SecurityRegistry...");
  const SecurityRegistry = await ethers.getContractFactory("SecurityRegistry");
  const securityRegistry = await SecurityRegistry.deploy();
  await securityRegistry.deployed();
  
  console.log("✅ SecurityRegistry deployed to:", securityRegistry.address);

  // Deploy SecurityToken
  console.log("\n🪙 Deploying SecurityToken...");
  const SecurityToken = await ethers.getContractFactory("SecurityToken");
  const securityToken = await SecurityToken.deploy(securityRegistry.address);
  await securityToken.deployed();
  
  console.log("✅ SecurityToken deployed to:", securityToken.address);

  // Deploy TransactionFirewall
  console.log("\n🛡️ Deploying TransactionFirewall...");
  const TransactionFirewall = await ethers.getContractFactory("TransactionFirewall");
  const transactionFirewall = await TransactionFirewall.deploy(securityRegistry.address);
  await transactionFirewall.deployed();
  
  console.log("✅ TransactionFirewall deployed to:", transactionFirewall.address);

  // Deploy CommunityReporting
  console.log("\n📢 Deploying CommunityReporting...");
  const CommunityReporting = await ethers.getContractFactory("CommunityReporting");
  const communityReporting = await CommunityReporting.deploy(
    securityRegistry.address,
    securityToken.address
  );
  await communityReporting.deployed();
  
  console.log("✅ CommunityReporting deployed to:", communityReporting.address);

  // Setup initial configurations
  console.log("\n⚙️ Setting up initial configurations...");

  // Authorize the TransactionFirewall as an analyzer
  await securityRegistry.authorizeAnalyzer(transactionFirewall.address);
  console.log("✅ TransactionFirewall authorized as analyzer");

  // Authorize the CommunityReporting as an analyzer
  await securityRegistry.authorizeAnalyzer(communityReporting.address);
  console.log("✅ CommunityReporting authorized as analyzer");

  // Add CommunityReporting as a reward minter for SecurityToken
  await securityToken.addRewardMinter(communityReporting.address);
  console.log("✅ CommunityReporting authorized as reward minter");

  // Add TransactionFirewall as a reward minter for SecurityToken
  await securityToken.addRewardMinter(transactionFirewall.address);
  console.log("✅ TransactionFirewall authorized as reward minter");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("=====================================");
  console.log("SecurityRegistry:", securityRegistry.address);
  console.log("SecurityToken:", securityToken.address);
  console.log("TransactionFirewall:", transactionFirewall.address);
  console.log("CommunityReporting:", communityReporting.address);
  console.log("=====================================");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SecurityRegistry: securityRegistry.address,
      SecurityToken: securityToken.address,
      TransactionFirewall: transactionFirewall.address,
      CommunityReporting: communityReporting.address,
    },
    gasUsed: {
      SecurityRegistry: (await securityRegistry.deployTransaction.wait()).gasUsed.toString(),
      SecurityToken: (await securityToken.deployTransaction.wait()).gasUsed.toString(),
      TransactionFirewall: (await transactionFirewall.deployTransaction.wait()).gasUsed.toString(),
      CommunityReporting: (await communityReporting.deployTransaction.wait()).gasUsed.toString(),
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Update environment file with contract addresses
  const fs = require("fs");
  const envUpdate = `
# Smart Contract Addresses (${hre.network.name})
SECURITY_REGISTRY_ADDRESS=${securityRegistry.address}
SECURITY_TOKEN_ADDRESS=${securityToken.address}
TRANSACTION_FIREWALL_ADDRESS=${transactionFirewall.address}
COMMUNITY_REPORTING_ADDRESS=${communityReporting.address}
`;

  fs.appendFileSync(".env", envUpdate);
  console.log("✅ Contract addresses added to .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });