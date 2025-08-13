# API Keys Setup Guide

## Required API Keys for Base Hackathon

### 1. 🔐 PRIVATE_KEY (Deployment Wallet)
**Purpose:** Deploy smart contracts to Base
**Cost:** FREE (but need ETH for gas)
**Steps:**
1. Open MetaMask
2. Account menu → Account Details → Export Private Key
3. Enter password → Copy key
4. Add to `.env` as `PRIVATE_KEY=0x...`

⚠️ **SECURITY:** Never share or commit this key!

### 2. 🔍 ETHERSCAN_API_KEY (Contract Verification)
**Purpose:** Verify contracts on BaseScan
**Cost:** FREE
**Website:** https://basescan.org/apis
**Steps:**
1. Go to https://basescan.org/apis
2. Click "Get a Free API Key Today"
3. Create account → Verify email
4. Copy API key from dashboard
5. Add to `.env` as `ETHERSCAN_API_KEY=abc123...`

### 3. ⚡ ALCHEMY_API_KEY (Blockchain RPC)
**Purpose:** Reliable Base network access
**Cost:** FREE (300M requests/month)
**Website:** https://dashboard.alchemy.com/
**Steps:**
1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create App → Select "Base" network
4. Copy API key from app dashboard
5. Add to `.env` as `ALCHEMY_API_KEY=abc123...`

### 4. 🤖 OPENAI_API_KEY (AI Analysis)
**Purpose:** GPT-4 smart contract analysis
**Cost:** $5 free credit (lasts months)
**Website:** https://platform.openai.com/api-keys
**Steps:**
1. Go to https://platform.openai.com/
2. Sign up/login → Verify phone number
3. API Keys section → Create new secret key
4. Copy key (shown only once!)
5. Add to `.env` as `OPENAI_API_KEY=sk-...`

### 5. 📊 TENDERLY (Transaction Simulation)
**Purpose:** Simulate transactions for security
**Cost:** 50 simulations/month FREE
**Website:** https://dashboard.tenderly.co/
**Steps:**
1. Go to https://tenderly.co/
2. Sign up → Create project
3. Settings → Authorization → Generate Access Key
4. Add to `.env`:
   ```
   TENDERLY_ACCESS_KEY=abc123...
   TENDERLY_USER=your_username
   TENDERLY_PROJECT=your_project_name
   ```

### 6. 🛡️ CHAINABASE_API_KEY (Enhanced Scam DB)
**Purpose:** Advanced scam address database
**Cost:** Usually FREE tier
**Website:** https://chainabase.com/
**Steps:**
1. Go to https://chainabase.com/
2. Sign up for account
3. Apply for API access
4. Copy API key when approved
5. Add to `.env` as `CHAINABASE_API_KEY=abc123...`

## Gas Fees Needed

### Base Sepolia (Testnet) - FREE
- Get test ETH from faucets:
  - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
  - https://sepolia-faucet.pk910.de/
  - https://sepoliafaucet.com/

### Base Mainnet - ~$25-50
- Buy ETH and bridge to Base:
  - https://bridge.base.org/
  - Or use Coinbase Wallet

## Environment Setup

1. Copy the template:
   ```bash
   cp env.template .env
   ```

2. Fill in your API keys:
   ```bash
   # Required for deployment
   PRIVATE_KEY=0x1234567890abcdef...
   ETHERSCAN_API_KEY=ABC123DEF456...
   ALCHEMY_API_KEY=abc123def456...
   
   # Required for AI features
   OPENAI_API_KEY=sk-abc123...
   TENDERLY_ACCESS_KEY=abc123...
   TENDERLY_USER=your_username
   TENDERLY_PROJECT=your_project
   
   # Optional enhanced features
   CHAINABASE_API_KEY=abc123...
   ```

3. Test deployment on testnet:
   ```bash
   npm run deploy:base-sepolia
   ```

## Priority Order

**For Hackathon Demo:**
1. ✅ PRIVATE_KEY (Required for deployment)
2. ✅ ETHERSCAN_API_KEY (Required for verification)  
3. ✅ ALCHEMY_API_KEY (Better than public RPC)
4. ⚠️ OPENAI_API_KEY (AI features work without it in demo mode)
5. ⚠️ TENDERLY (Simulation works with mock data)
6. ⚠️ CHAINABASE (Scam DB works with basic data)

**Minimum for Smart Contract Deployment:**
- PRIVATE_KEY + ETH for gas
- ETHERSCAN_API_KEY for verification
- ALCHEMY_API_KEY for reliable RPC

## Quick Test

After setting up `.env`, test your configuration:

```bash
# Test compilation
npm run compile

# Test deployment to testnet
npm run deploy:base-sepolia

# Test API connection
npm run dev
```

## Security Checklist

- [ ] ✅ Added `.env` to `.gitignore`
- [ ] ✅ Never shared PRIVATE_KEY
- [ ] ✅ Used testnet first
- [ ] ✅ Verified contract addresses
- [ ] ✅ Tested API endpoints