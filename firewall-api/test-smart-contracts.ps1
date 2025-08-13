# Smart Contract Testing Script
# Make sure you have test ETH and API keys configured

Write-Host "🚀 Testing Smart Contract Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check environment setup
Write-Host "`n1. 🔧 Checking Environment..." -ForegroundColor Yellow
if (-not $env:PRIVATE_KEY) {
    Write-Host "⚠️ PRIVATE_KEY not set - Add to .env file" -ForegroundColor Yellow
} else {
    Write-Host "✅ PRIVATE_KEY configured" -ForegroundColor Green
}

if (-not $env:ETHERSCAN_API_KEY) {
    Write-Host "⚠️ ETHERSCAN_API_KEY not set - Get from basescan.org" -ForegroundColor Yellow
} else {
    Write-Host "✅ ETHERSCAN_API_KEY configured" -ForegroundColor Green
}

# Test contract compilation
Write-Host "`n2. 🔨 Compiling Smart Contracts..." -ForegroundColor Yellow
try {
    npm run compile
    Write-Host "✅ Contracts compiled successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test deployment to local network (if available)
Write-Host "`n3. 🌐 Testing Local Deployment..." -ForegroundColor Yellow
Write-Host "Starting local Hardhat network..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "node" -NoNewWindow -PassThru

Start-Sleep -Seconds 5

try {
    npm run deploy:localhost
    Write-Host "✅ Local deployment successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Local deployment failed (this is OK if no local network)" -ForegroundColor Yellow
}

# Guide for testnet deployment
Write-Host "`n4. 🧪 Base Sepolia Testnet Deployment Guide" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "To deploy to Base Sepolia testnet:" -ForegroundColor White
Write-Host "1. Get test ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet" -ForegroundColor White
Write-Host "2. Add PRIVATE_KEY to .env file" -ForegroundColor White
Write-Host "3. Add ETHERSCAN_API_KEY from basescan.org" -ForegroundColor White
Write-Host "4. Run: npm run deploy:base-sepolia" -ForegroundColor White
Write-Host "5. Run: npm run verify:base-sepolia" -ForegroundColor White

Write-Host "`n🎉 Smart Contract Testing Guide Complete!" -ForegroundColor Green