# 🛡️ Transaction Firewall API

Real-time AI-powered transaction security for Base blockchain that prevents users from falling victim to scams, exploits, and malicious contracts.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- API keys for external services (optional for development)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**
```bash
# Create PostgreSQL database
createdb firewall_db

# The database schema will be initialized automatically on first run
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📋 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependency checks

### Analysis
- `POST /api/analysis/transaction` - Analyze a single transaction
- `POST /api/analysis/simulate` - Simulate a transaction
- `POST /api/analysis/batch` - Analyze multiple transactions
- `GET /api/analysis/history/:userAddress` - Get analysis history

### Address Risk
- `GET /api/address/:address/risk` - Check address risk level

### Dashboard
- `GET /api/dashboard/:userAddress` - Get user security dashboard

## 🧪 Testing the API

### Test Transaction Analysis
```bash
curl -X POST http://localhost:3001/api/analysis/transaction \
  -H "Content-Type: application/json" \
  -d @test-transaction.json
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "riskScore": 15,
    "riskLevel": "LOW",
    "warnings": [],
    "analysis": {
      "isKnownScam": false,
      "hasSuspiciousCode": false,
      "hasUnlimitedApprovals": false,
      "isNewContract": false,
      "simulationResult": {
        "success": true,
        "gasUsed": "21000"
      },
      "aiAnalysis": {
        "contractRisk": 0,
        "riskFactors": []
      }
    },
    "recommendation": "PROCEED",
    "userFriendlyMessage": "✅ LOW RISK: This transaction appears safe to proceed."
  },
  "message": "Transaction analysis completed",
  "timestamp": "2025-01-13T19:30:00.000Z"
}
```

## 🏗️ Architecture

### Core Components

1. **TransactionAnalyzer** - Main analysis orchestrator
2. **RiskScoringService** - Calculates risk scores
3. **SimulationService** - Simulates transactions (Tenderly integration)
4. **AIService** - AI contract analysis (OpenAI integration)
5. **ScamDatabaseService** - Maintains known scam addresses
6. **ContractService** - Fetches and caches contract information

### Risk Scoring Algorithm

```javascript
const riskScore = 
  + (isKnownScam ? 90 : 0)
  + (hasSuspiciousCode ? 60 : 0)  
  + (hasUnlimitedApprovals ? 40 : 0)
  + (isNewContract ? 30 : 0)
  + (simulationFailed ? 50 : 0)
  + aiRiskScore
  + gasRiskScore
  + transactionRiskScore;
```

### Risk Levels
- **0-24**: LOW (✅ Proceed)
- **25-49**: MEDIUM (⚠️ Caution)
- **50-74**: HIGH (⚠️ Caution)
- **75-100**: CRITICAL (🚨 Block)

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
ALCHEMY_API_KEY=your_alchemy_key

# External APIs
OPENAI_API_KEY=your_openai_key
TENDERLY_ACCESS_KEY=your_tenderly_key
TENDERLY_USER=your_tenderly_user
TENDERLY_PROJECT=your_tenderly_project
CHAINABASE_API_KEY=your_chainabase_key
```

## 📊 Database Schema

The API automatically creates the following tables:

- `scam_addresses` - Known scam/malicious addresses
- `user_transactions` - Transaction analysis history
- `user_security_scores` - User security scoring
- `contract_info` - Contract information cache
- `risk_patterns` - Risk pattern definitions

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (coming soon)

### Project Structure
```
src/
├── config/          # Configuration and database setup
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Express server setup
```

## 🚀 Deployment

### Production Environment

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**
```bash
NODE_ENV=production
# Set all required API keys
```

3. **Start the server**
```bash
npm start
```

### Docker Deployment (Coming Soon)
```bash
docker build -t transaction-firewall-api .
docker run -p 3001:3001 transaction-firewall-api
```

## 🔐 Security Features

- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Error handling

## 🎯 MVP Status

### ✅ Completed
- [x] Basic API server setup
- [x] Database schema and connection
- [x] Transaction analysis framework
- [x] Risk scoring algorithm
- [x] Health check endpoints
- [x] Error handling and logging
- [x] Input validation

### 🔄 In Progress
- [ ] Tenderly simulation integration
- [ ] OpenAI contract analysis
- [ ] Chainabase scam database
- [ ] WebSocket real-time alerts

### 📋 TODO
- [ ] Frontend integration
- [ ] Advanced ML models
- [ ] Multi-chain support
- [ ] Browser extension
- [ ] Community reporting

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 📜 License

MIT License - See LICENSE file for details
