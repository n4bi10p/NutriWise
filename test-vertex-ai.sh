#!/bin/bash

echo "🧪 Testing Vertex AI Integration"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Check if server files exist
echo -e "${BLUE}📁 Checking server files...${NC}"
if [ -f "server/vertex-ai.js" ] && [ -f "server/package.json" ]; then
    echo -e "${GREEN}✅ Server files exist${NC}"
else
    echo -e "${RED}❌ Server files missing${NC}"
    exit 1
fi

# Test 2: Check if frontend component exists
echo -e "${BLUE}🎨 Checking frontend component...${NC}"
if [ -f "src/components/VertexAIImageGenerator.tsx" ]; then
    echo -e "${GREEN}✅ VertexAIImageGenerator component exists${NC}"
else
    echo -e "${RED}❌ VertexAIImageGenerator component missing${NC}"
    exit 1
fi

# Test 3: Check if environment files are configured
echo -e "${BLUE}⚙️ Checking environment configuration...${NC}"
if [ -f ".env" ] && grep -q "VITE_VERTEX_AI_API_URL" .env; then
    echo -e "${GREEN}✅ Frontend environment configured${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend environment needs configuration${NC}"
fi

if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ Server environment file exists${NC}"
else
    echo -e "${YELLOW}⚠️ Server environment needs configuration${NC}"
fi

# Test 4: Check if dependencies are installed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
cd server
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Server dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️ Installing server dependencies...${NC}"
    npm install
fi

cd ..
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend dependencies need installation${NC}"
fi

# Test 5: Start server and test endpoints
echo -e "${BLUE}🚀 Testing server endpoints...${NC}"
cd server

# Check if server environment is configured
if [ -f ".env" ] && grep -q "GOOGLE_CLOUD_PROJECT_ID" .env; then
    echo "Starting test server..."
    
    # Start server in background
    node vertex-ai.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/health)
    if [[ "$HEALTH_RESPONSE" == *"200" ]]; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi
    
    # Test auth endpoint
    echo "Testing authentication..."
    AUTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/test-auth)
    if [[ "$AUTH_RESPONSE" == *"200" ]]; then
        echo -e "${GREEN}✅ Authentication configured${NC}"
    else
        echo -e "${YELLOW}⚠️ Authentication needs setup${NC}"
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
else
    echo -e "${YELLOW}⚠️ Server environment not configured, skipping endpoint tests${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Core files are in place"
echo "✅ Components are ready"
echo "✅ Dependencies can be installed"

echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
if [ ! -f "server/.env" ] || ! grep -q "GOOGLE_CLOUD_PROJECT_ID" server/.env; then
    echo "1. Run: ./setup-vertex-ai.sh"
    echo "2. Provide your Google Cloud Project ID"
    echo "3. Provide your service account credentials"
else
    echo "1. Start backend: cd server && npm start"
    echo "2. Start frontend: npm run dev"
    echo "3. Test in Menu Analyzer"
fi

echo ""
echo -e "${GREEN}🎉 Integration is ready for setup!${NC}"
