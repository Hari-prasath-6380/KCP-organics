#!/bin/bash
# Products Backend Integration Test Script
# This script tests if the products API is working correctly

echo "================================"
echo "🛒 KCP Organics - Products API Test"
echo "================================"
echo ""

# Test 1: Check if server is running
echo "Test 1: Checking if server is running..."
curl -s http://localhost:5000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server is running on port 5000"
else
    echo "❌ Server is NOT running. Start with: cd backend && npm start"
    exit 1
fi

echo ""

# Test 2: Check if MongoDB is connected
echo "Test 2: Checking MongoDB connection..."
curl -s http://localhost:5000/user/all > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MongoDB is connected"
else
    echo "❌ MongoDB is NOT connected. Make sure mongod is running"
fi

echo ""

# Test 3: Fetch products
echo "Test 3: Fetching products from /api/products..."
RESPONSE=$(curl -s http://localhost:5000/api/products?limit=100)

if echo "$RESPONSE" | grep -q "success"; then
    COUNT=$(echo "$RESPONSE" | grep -o '"_id"' | wc -l)
    echo "✅ API Response received"
    echo "📊 Found $COUNT products in database"
    echo ""
    echo "Sample Response:"
    echo "$RESPONSE" | jq '.' | head -50
else
    echo "❌ API returned error or no response"
    echo "Response: $RESPONSE"
fi

echo ""
echo "================================"
echo "Test Complete!"
echo "================================"
