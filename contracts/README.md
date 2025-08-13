# Smart Contracts - Transaction Firewall

This directory contains the smart contracts for the Transaction Firewall security system deployed on Base blockchain.

## Contracts Overview

### 1. SecurityRegistry.sol
**Core security data management contract**
- Stores security scores and risk assessments for addresses
- Maintains blacklist of known scam addresses
- Manages user reputation and analyst permissions
- Handles community-driven security reporting

**Key Features:**
- Risk scoring (0-100 scale)
- Automatic blacklisting at threshold (75+)
- Authorized analyzer system
- Community reporting with voting

### 2. TransactionFirewall.sol
**Transaction security proxy contract**
- Intercepts and analyzes transactions before execution
- Implements risk-based transaction blocking
- Quarantine system for high-risk transactions
- Emergency controls and bypass mechanisms

**Key Features:**
- Real-time risk assessment
- Automatic blocking of critical risk transactions
- 24-hour quarantine for high-risk transactions
- Batch transaction support
- Emergency cancellation

### 3. SecurityToken.sol
**ERC20 reward and governance token**
- Rewards users for secure behavior
- Penalizes risky interactions
- Staking mechanism for additional rewards
- Governance capabilities for protocol decisions

**Key Features:**
- Threat blocking rewards (50 SEC)
- Valid report rewards (25 SEC)
- Analysis rewards (10 SEC)
- Scam interaction penalties (-100 SEC)
- Staking with APY rewards

### 4. CommunityReporting.sol
**Decentralized scam reporting system**
- Community-driven scam address reporting
- Stake-based reporting with economic incentives
- Voting mechanism for report verification
- Reward distribution for accurate reports

**Key Features:**
- Minimum stake requirement (100 SEC)
- 7-day voting period
- Reputation tracking for reporters
- Reward multipliers for successful reports

## Deployment

### Prerequisites
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Local Development
```bash
# Start local Hardhat network
npm run node

# Deploy to local network
npm run deploy:localhost

# Compile contracts
npm run compile
```

### Base Sepolia Testnet
```bash
# Deploy to Base Sepolia
npm run deploy:base-sepolia

# Verify contracts
npm run verify:base-sepolia
```

### Base Mainnet
```bash
# Deploy to Base mainnet
npm run deploy:base

# Verify contracts
npm run verify:base
```

## Integration with Backend API

The smart contracts integrate with the backend API through `ContractIntegrationService.ts`:

### Key Integration Points:

1. **Security Score Updates**
   ```typescript
   await contractService.updateOnChainSecurityScore(address, riskScore, factors);
   ```

2. **Threat Blocking Rewards**
   ```typescript
   await contractService.rewardThreatBlocked(userAddress);
   ```

3. **Scam Reporting**
   ```typescript
   await contractService.reportScamOnChain(address, reason, evidence);
   ```

4. **User Token Balance**
   ```typescript
   const balance = await contractService.getUserTokenBalance(userAddress);
   ```

## Contract Interactions

### For Users:
- **Safe Transaction Execution**: Use TransactionFirewall for protected transactions
- **Earn Rewards**: Get SEC tokens for using security features
- **Report Scams**: Submit reports through CommunityReporting
- **Stake Tokens**: Stake SEC for additional rewards

### For Developers:
- **Security Checks**: Query SecurityRegistry for address risk data
- **Integration**: Use ContractIntegrationService for API integration
- **Events**: Listen to contract events for real-time updates

## Security Features

### Risk Levels:
- **0-24**: LOW (✅ Proceed)
- **25-49**: MEDIUM (⚠️ Caution)
- **50-74**: HIGH (⚠️ Caution/Quarantine)
- **75-100**: CRITICAL (🚨 Block)

### Protection Mechanisms:
- Automatic blacklisting of high-risk addresses
- Transaction simulation before execution
- Community-driven scam reporting
- Economic incentives for security participation
- Emergency controls for rapid response

## Gas Optimization

All contracts are optimized for gas efficiency:
- Use of `immutable` for contract addresses
- Efficient storage patterns
- Batch operations where possible
- Strategic use of events for off-chain indexing

## Upgradability

The current contracts are non-upgradeable for security reasons. Future versions may implement proxy patterns if governance mechanisms are established.

## Testing

```bash
# Run contract tests (when implemented)
npx hardhat test

# Gas reporting
REPORT_GAS=true npx hardhat test
```

## Contract Addresses

After deployment, contract addresses will be automatically added to your `.env` file:

```bash
SECURITY_REGISTRY_ADDRESS=0x...
SECURITY_TOKEN_ADDRESS=0x...
TRANSACTION_FIREWALL_ADDRESS=0x...
COMMUNITY_REPORTING_ADDRESS=0x...
```

## Events and Monitoring

### Key Events to Monitor:
- `SecurityScoreUpdated`: Track risk score changes
- `AddressBlacklisted`: Monitor new scam addresses
- `TransactionBlocked`: Track blocked threats
- `ReportSubmitted`: Monitor community reports
- `RewardMinted`: Track token distribution

## Support

For issues or questions:
1. Check the deployment logs
2. Verify contract addresses in `.env`
3. Ensure sufficient ETH for gas fees
4. Confirm network configuration in `hardhat.config.js`