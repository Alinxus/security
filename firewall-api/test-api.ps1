# Test Transaction Firewall API

Write-Host "🧪 Testing Transaction Firewall API" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Info
Write-Host "`n2. API Info:" -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "http://localhost:3001/" -Method GET
    Write-Host "✅ API: $($info.message)" -ForegroundColor Green
    Write-Host "   Version: $($info.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API info failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Transaction Analysis
Write-Host "`n3. Transaction Analysis:" -ForegroundColor Yellow
try {
    $transaction = @{
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
    
    $body = $transaction | ConvertTo-Json -Depth 10
    $analysis = Invoke-RestMethod -Uri "http://localhost:3001/api/analysis/transaction" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Analysis completed!" -ForegroundColor Green
    Write-Host "   Risk Score: $($analysis.data.riskScore)" -ForegroundColor Gray
    Write-Host "   Risk Level: $($analysis.data.riskLevel)" -ForegroundColor Gray
    Write-Host "   Recommendation: $($analysis.data.recommendation)" -ForegroundColor Gray
    Write-Host "   Message: $($analysis.data.userFriendlyMessage)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Transaction analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API testing completed!" -ForegroundColor Cyan
