# 🧪 Transaction Firewall Testing Scenarios

## Quick Start Testing

### 1. 🚀 Start the Server
```bash
# Option A: With database
npm run dev

# Option B: Demo mode (no database needed)
set DEMO_MODE=true && npm run dev
```

### 2. 🏥 Basic Health Checks
```powershell
# Run the automated test script
.\test-endpoints.ps1

# Or manual testing:
curl http://localhost:3001/health
curl http://localhost:3001/api/health/detailed
```

## 🔬 API Testing Scenarios

### Scenario 1: Safe Transaction
**Purpose:** Test low-risk transaction analysis

```json
POST http://localhost:3001/api/analysis/transaction
{
  "transaction": {
    "to": "0x742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b8",
    "from": "0x1234567890123456789012345678901234567890",
    "value": "1000000000000000000",
    "data": "0xa9059cbb000000000000000000000000742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b80000000000000000000000000000000000000000000000000de0b6b3a7640000",
    "gas": "21000",
    "gasPrice": "20000000000",
    "nonce": 1,
    "chainId": 8453
  }
}
```
**Expected:** `riskLevel: "LOW"`, `recommendation: "PROCEED"`

### Scenario 2: High-Value Transaction
**Purpose:** Test risk scoring for large transfers

```json
POST http://localhost:3001/api/analysis/transaction
{
  "transaction": {
    "to": "0x0000000000000000000000000000000000000000",
    "from": "0x1234567890123456789012345678901234567890",
    "value": "100000000000000000000",
    "data": "0x",
    "gas": "21000",
    "gasPrice": "20000000000",
    "nonce": 2,
    "chainId": 8453
  }
}
```
**Expected:** Higher risk score due to null address and large value

### Scenario 3: Complex Contract Interaction
**Purpose:** Test analysis of smart contract calls

```json
POST http://localhost:3001/api/analysis/transaction
{
  "transaction": {
    "to": "0xa0b86a33e6e6c888c68b8b3b0c0b5c0d0e0f0a1b",
    "from": "0x1234567890123456789012345678901234567890", 
    "value": "0",
    "data": "0xa22cb4650000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000001",
    "gas": "500000",
    "gasPrice": "20000000000",
    "nonce": 3,
    "chainId": 8453
  }
}
```
**Expected:** Analysis of contract interaction patterns

### Scenario 4: Batch Transaction Analysis
**Purpose:** Test multiple transactions at once

```json
POST http://localhost:3001/api/analysis/batch
{
  "transactions": [
    {
      "to": "0x742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b8",
      "from": "0x1234567890123456789012345678901234567890",
      "value": "1000000000000000000",
      "data": "0x",
      "gas": "21000",
      "gasPrice": "20000000000",
      "nonce": 1,
      "chainId": 8453
    },
    {
      "to": "0xa0b86a33e6e6c888c68b8b3b0c0b5c0d0e0f0a1b",
      "from": "0x1234567890123456789012345678901234567890",
      "value": "500000000000000000",
      "data": "0x",
      "gas": "21000", 
      "gasPrice": "20000000000",
      "nonce": 2,
      "chainId": 8453
    }
  ]
}
```

## 🎯 Address Risk Testing

### Test Known Addresses
```bash
# Test different address types
curl http://localhost:3001/api/address/0x0000000000000000000000000000000000000000/risk
curl http://localhost:3001/api/address/0x742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b8/risk
curl http://localhost:3001/api/address/0x1234567890123456789012345678901234567890/risk
```

## 📊 Dashboard Testing

### User Security Dashboard
```bash
# Test user dashboard with transaction history
curl http://localhost:3001/api/dashboard/0x1234567890123456789012345678901234567890
```

## 🔗 Smart Contract Testing

### 1. Local Testing
```bash
# Start local hardhat network
npm run node

# Deploy contracts locally
npm run deploy:localhost

# Test contract integration
# (Your API should connect to deployed contracts)
```

### 2. Base Sepolia Testnet
```bash
# Prerequisites:
# - Get test ETH from Base Sepolia faucet
# - Add PRIVATE_KEY to .env
# - Add ETHERSCAN_API_KEY to .env

# Deploy to testnet
npm run deploy:base-sepolia

# Verify contracts
npm run verify:base-sepolia

# Test integration with real blockchain
```

## 🎮 Demo Scenarios for Hackathon

### Demo Script 1: Basic Protection
1. **Show API health**: `curl /health`
2. **Analyze safe transaction**: Show LOW risk response
3. **Analyze risky transaction**: Show HIGH risk warning
4. **Show real-time analysis**: Sub-2-second responses

### Demo Script 2: Smart Contract Integration
1. **Show deployed contracts** on Base Sepolia BaseScan
2. **Demonstrate on-chain security scores**
3. **Show token rewards system**
4. **Display community reporting**

### Demo Script 3: User Experience
1. **User dashboard**: Show security scores and history
2. **Risk progression**: Show how risk scores change
3. **Gamification**: Show token rewards for secure behavior

## 🚨 Error Testing

### Test Error Handling
```bash
# Invalid transaction format
curl -X POST http://localhost:3001/api/analysis/transaction \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Missing required fields
curl -X POST http://localhost:3001/api/analysis/transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction": {}}'

# Rate limiting (send many requests quickly)
for i in {1..150}; do curl http://localhost:3001/health; done
```

## 📈 Performance Testing

### Response Time Testing
```bash
# Measure API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/analysis/transaction

# Create curl-format.txt:
echo "     time_namelookup:  %{time_namelookup}
        time_connect:  %{time_connect}
     time_appconnect:  %{time_appconnect}
    time_pretransfer:  %{time_pretransfer}
       time_redirect:  %{time_redirect}
  time_starttransfer:  %{time_starttransfer}
                     ----------
          time_total:  %{time_total}" > curl-format.txt
```

## ✅ Expected Results

### Successful API Responses
- **Health checks**: Status 200, "healthy" response
- **Transaction analysis**: Risk scores 0-100, clear recommendations
- **Address risk**: Risk levels and explanations
- **Dashboard**: User statistics and history

### Smart Contract Deployment
- **Compilation**: No errors, artifacts generated
- **Deployment**: Contract addresses returned
- **Verification**: Contracts visible on BaseScan
- **Integration**: API connects to deployed contracts

## 🎯 Hackathon Judging Points

1. **Functionality**: All endpoints working
2. **Performance**: Sub-2-second response times
3. **Security**: Proper risk assessment
4. **Blockchain Integration**: Real contracts on Base
5. **User Experience**: Clear warnings and recommendations
6. **Innovation**: AI-powered analysis with community features

## 🛠️ Troubleshooting

### Common Issues
- **Database connection fails**: Set `DEMO_MODE=true`
- **TypeScript errors**: Run `npm install` for missing dependencies
- **Contract deployment fails**: Check PRIVATE_KEY and test ETH balance
- **API not responding**: Check port 3001 is free

### Debug Commands
```bash
# Check server logs
npm run dev

# Check contract compilation
npm run compile

# Test database connection
npm run db:push

# Check environment variables
echo $env:DATABASE_URL
echo $env:DEMO_MODE
```