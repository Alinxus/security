# Transaction Firewall API Testing Script
# Run this after starting the server with: npm run dev

Write-Host "🧪 Testing Transaction Firewall API" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$baseUrl = "http://localhost:3001"

# Test 1: Health Check
Write-Host "`n1. 🏥 Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check:" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Detailed Health Check
Write-Host "`n2. 🔍 Testing Detailed Health..." -ForegroundColor Yellow
try {
    $detailedHealth = Invoke-RestMethod -Uri "$baseUrl/api/health/detailed" -Method GET
    Write-Host "✅ Detailed Health:" -ForegroundColor Green
    $detailedHealth | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Detailed health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Transaction Analysis
Write-Host "`n3. 🔬 Testing Transaction Analysis..." -ForegroundColor Yellow
$testTransaction = @{
    transaction = @{
        to = "0x742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b8"
        from = "0x1234567890123456789012345678901234567890"
        value = "1000000000000000000"
        data = "0xa9059cbb000000000000000000000000742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b80000000000000000000000000000000000000000000000000de0b6b3a7640000"
        gas = "21000"
        gasPrice = "20000000000"
        nonce = 1
        chainId = 8453
    }
}

try {
    $analysisResult = Invoke-RestMethod -Uri "$baseUrl/api/analysis/transaction" -Method POST -Body ($testTransaction | ConvertTo-Json -Depth 3) -ContentType "application/json"
    Write-Host "✅ Transaction Analysis:" -ForegroundColor Green
    $analysisResult | ConvertTo-Json -Depth 4
} catch {
    Write-Host "❌ Transaction analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Address Risk Check
Write-Host "`n4. 🎯 Testing Address Risk Check..." -ForegroundColor Yellow
$testAddress = "0x742d35cc6670f4a3f8b0e1e0c4e1b8e8b8b8b8b8"
try {
    $riskCheck = Invoke-RestMethod -Uri "$baseUrl/api/address/$testAddress/risk" -Method GET
    Write-Host "✅ Address Risk Check:" -ForegroundColor Green
    $riskCheck | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Address risk check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: User Dashboard
Write-Host "`n5. 📊 Testing User Dashboard..." -ForegroundColor Yellow
$userAddress = "0x1234567890123456789012345678901234567890"
try {
    $dashboard = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/$userAddress" -Method GET
    Write-Host "✅ User Dashboard:" -ForegroundColor Green
    $dashboard | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Dashboard failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Transaction Simulation
Write-Host "`n6. 🎮 Testing Transaction Simulation..." -ForegroundColor Yellow
try {
    $simulationResult = Invoke-RestMethod -Uri "$baseUrl/api/analysis/simulate" -Method POST -Body ($testTransaction | ConvertTo-Json -Depth 3) -ContentType "application/json"
    Write-Host "✅ Transaction Simulation:" -ForegroundColor Green
    $simulationResult | ConvertTo-Json -Depth 4
} catch {
    Write-Host "❌ Simulation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Testing Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green