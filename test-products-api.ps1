# Products Backend Integration Test Script (Windows PowerShell)
# This script tests if the products API is working correctly

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🛒 KCP Organics - Products API Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "Test 1: Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Server is running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is NOT running. Start with: cd backend && npm start" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check if MongoDB is connected
Write-Host "Test 2: Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/user/all" -Method Get -TimeoutSec 5
    Write-Host "✅ MongoDB is connected" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is NOT connected. Make sure mongod is running" -ForegroundColor Red
}

Write-Host ""

# Test 3: Fetch products
Write-Host "Test 3: Fetching products from /api/products..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/products?limit=100" -Method Get
    $jsonData = $response.Content | ConvertFrom-Json
    
    if ($jsonData.success) {
        $productCount = @($jsonData.data).Count
        Write-Host "✅ API Response received" -ForegroundColor Green
        Write-Host "📊 Found $productCount products in database" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Sample Response (first product):" -ForegroundColor Yellow
        
        if ($productCount -gt 0) {
            $jsonData.data[0] | ConvertTo-Json | Write-Host
        } else {
            Write-Host "No products found in database" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ API returned error" -ForegroundColor Red
        Write-Host "Response: $($response.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to fetch products" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
