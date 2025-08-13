const { run } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification...");
  
  // Contract addresses from deployment
  const contracts = {
    SecurityRegistry: process.env.SECURITY_REGISTRY_ADDRESS,
    SecurityToken: process.env.SECURITY_TOKEN_ADDRESS,
    TransactionFirewall: process.env.TRANSACTION_FIREWALL_ADDRESS,
    CommunityReporting: process.env.COMMUNITY_REPORTING_ADDRESS,
  };

  // Verify SecurityRegistry
  if (contracts.SecurityRegistry) {
    console.log("\n📊 Verifying SecurityRegistry...");
    try {
      await run("verify:verify", {
        address: contracts.SecurityRegistry,
        constructorArguments: [],
      });
      console.log("✅ SecurityRegistry verified");
    } catch (error) {
      console.log("❌ SecurityRegistry verification failed:", error.message);
    }
  }

  // Verify SecurityToken
  if (contracts.SecurityToken && contracts.SecurityRegistry) {
    console.log("\n🪙 Verifying SecurityToken...");
    try {
      await run("verify:verify", {
        address: contracts.SecurityToken,
        constructorArguments: [contracts.SecurityRegistry],
      });
      console.log("✅ SecurityToken verified");
    } catch (error) {
      console.log("❌ SecurityToken verification failed:", error.message);
    }
  }

  // Verify TransactionFirewall
  if (contracts.TransactionFirewall && contracts.SecurityRegistry) {
    console.log("\n🛡️ Verifying TransactionFirewall...");
    try {
      await run("verify:verify", {
        address: contracts.TransactionFirewall,
        constructorArguments: [contracts.SecurityRegistry],
      });
      console.log("✅ TransactionFirewall verified");
    } catch (error) {
      console.log("❌ TransactionFirewall verification failed:", error.message);
    }
  }

  // Verify CommunityReporting
  if (contracts.CommunityReporting && contracts.SecurityRegistry && contracts.SecurityToken) {
    console.log("\n📢 Verifying CommunityReporting...");
    try {
      await run("verify:verify", {
        address: contracts.CommunityReporting,
        constructorArguments: [contracts.SecurityRegistry, contracts.SecurityToken],
      });
      console.log("✅ CommunityReporting verified");
    } catch (error) {
      console.log("❌ CommunityReporting verification failed:", error.message);
    }
  }

  console.log("\n🎉 Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });