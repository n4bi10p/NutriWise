#!/bin/bash

echo "🚀 Setting up NutriWise Vertex AI Integration"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 Prerequisites Checklist:${NC}"
echo "1. Google Cloud Project with Vertex AI API enabled"
echo "2. Service Account with Vertex AI User permissions"
echo "3. Service Account JSON key file downloaded"
echo "4. Project ID and credentials ready"

echo ""
echo -e "${YELLOW}⚙️  Step 1: Install Server Dependencies${NC}"
cd server
if [ ! -f "package.json" ]; then
    echo "❌ Server package.json not found. Make sure you're in the correct directory."
    exit 1
fi

echo "Installing Node.js dependencies..."
npm install

echo ""
echo -e "${YELLOW}⚙️  Step 2: Environment Configuration${NC}"
echo ""
echo "Please provide the following information:"

# Get Project ID
read -p "Enter your Google Cloud Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID is required${NC}"
    exit 1
fi

# Get service account credentials
echo ""
echo "For the service account JSON credentials, you have two options:"
echo "1. Provide the path to your service account JSON file"
echo "2. Paste the JSON content directly"
echo ""
read -p "Choose option (1 or 2): " CRED_OPTION

if [ "$CRED_OPTION" = "1" ]; then
    read -p "Enter the path to your service account JSON file: " CRED_PATH
    if [ ! -f "$CRED_PATH" ]; then
        echo -e "${RED}❌ File not found: $CRED_PATH${NC}"
        exit 1
    fi
    CREDENTIALS_JSON=$(cat "$CRED_PATH")
elif [ "$CRED_OPTION" = "2" ]; then
    echo "Paste your service account JSON content (press Ctrl+D when done):"
    CREDENTIALS_JSON=$(cat)
else
    echo -e "${RED}❌ Invalid option${NC}"
    exit 1
fi

# Encode credentials to base64
CREDENTIALS_BASE64=$(echo "$CREDENTIALS_JSON" | base64 -w 0)

# Create/update .env file
cat > .env << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
GOOGLE_CREDENTIALS_BASE64=$CREDENTIALS_BASE64

# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: Enable debug logging
DEBUG=vertex-ai:*
EOF

echo -e "${GREEN}✅ Server environment configured${NC}"

# Update frontend .env
cd ..
if [ -f ".env" ]; then
    # Check if VITE_VERTEX_AI_API_URL already exists
    if ! grep -q "VITE_VERTEX_AI_API_URL" .env; then
        echo "" >> .env
        echo "# Vertex AI Configuration" >> .env
        echo "VITE_VERTEX_AI_API_URL=http://localhost:3001" >> .env
        echo -e "${GREEN}✅ Frontend environment updated${NC}"
    else
        echo -e "${YELLOW}⚠️  VITE_VERTEX_AI_API_URL already exists in .env${NC}"
    fi
else
    echo -e "${RED}❌ Frontend .env file not found${NC}"
fi

echo ""
echo -e "${YELLOW}⚙️  Step 3: Test Configuration${NC}"
cd server

echo "Starting server for configuration test..."
timeout 10 npm start &
SERVER_PID=$!

sleep 5

# Test health endpoint
echo "Testing server health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Server health check passed${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
fi

# Test authentication
echo "Testing Google Cloud authentication..."
AUTH_RESPONSE=$(curl -s http://localhost:3001/api/test-auth)
if [[ "$AUTH_RESPONSE" == *"success"* ]]; then
    echo -e "${GREEN}✅ Google Cloud authentication successful${NC}"
else
    echo -e "${RED}❌ Google Cloud authentication failed${NC}"
    echo "Response: $AUTH_RESPONSE"
fi

# Stop test server
kill $SERVER_PID 2>/dev/null

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Start the backend server: cd server && npm start"
echo "2. Start the frontend: npm run dev"
echo "3. Upload a menu image in the Menu Analyzer"
echo "4. Watch AI-generated food images appear!"
echo ""
echo -e "${BLUE}🔧 Commands:${NC}"
echo "Backend server: cd server && npm start"
echo "Frontend dev:   npm run dev"
echo "Test auth:      curl http://localhost:3001/api/test-auth"
echo ""
echo -e "${YELLOW}⚠️  Security Note:${NC}"
echo "The base64 credentials are stored in server/.env"
echo "Never commit this file to version control!"
echo "For production, use Netlify environment variables."

echo ""
echo -e "${BLUE}🚀 Ready to generate AI food images with Vertex AI!${NC}"
