#!/bin/bash

# Quickzy Local Setup Script for Mac
echo "🚀 Quickzy Local Setup"
echo "====================="
echo ""

# Step 1: Find Mac IP
echo "📡 Finding your Mac's IP address..."
MAC_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "✓ Your Mac IP: $MAC_IP"
echo ""

# Step 2: Ask user which device
echo "📱 Which device will you use?"
echo "1) iOS Simulator (recommended)"
echo "2) Physical iPhone/iPad"
echo "3) Android Emulator"
echo "4) Physical Android Device"
read -p "Enter choice (1-4): " device_choice
echo ""

# Set backend URL based on device
case $device_choice in
  1)
    BACKEND_URL="http://localhost:8001"
    echo "✓ Using localhost for iOS Simulator"
    ;;
  2|3|4)
    BACKEND_URL="http://$MAC_IP:8001"
    echo "✓ Using Mac IP for physical device: $BACKEND_URL"
    ;;
  *)
    echo "Invalid choice, using localhost"
    BACKEND_URL="http://localhost:8001"
    ;;
esac
echo ""

# Step 3: Update .env file
echo "📝 Updating frontend/.env file..."
cd /Users/kp/Documents/GitHub/Quickzymobile/frontend
cat > .env << EOF
# Quickzy Local Development
EXPO_PUBLIC_BACKEND_URL=$BACKEND_URL
EOF
echo "✓ .env file updated"
echo ""

# Step 4: Check MongoDB
echo "🗄️  Checking MongoDB..."
if brew services list | grep -q "mongodb-community.*started"; then
    echo "✓ MongoDB is running"
else
    echo "⚠️  MongoDB is not running. Starting it..."
    brew services start mongodb-community
    sleep 3
    echo "✓ MongoDB started"
fi
echo ""

# Step 5: Seed database
echo "🌱 Seeding database with test data..."
cd /Users/kp/Documents/GitHub/Quickzymobile/backend
source venv/bin/activate
python seed_data.py
echo ""

# Step 6: Display test credentials
echo "═══════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🔐 TEST CREDENTIALS:"
echo ""
echo "1️⃣  CUSTOMER:"
echo "   Phone: +11234567890"
echo "   OTP: 123456 (any 6 digits)"
echo "   Name: John Customer"
echo ""
echo "2️⃣  RESTAURANT OWNER:"
echo "   Phone: +11234567891"
echo "   OTP: 123456"
echo "   Name: Sarah Restaurant Owner"
echo ""
echo "3️⃣  DELIVERY PARTNER:"
echo "   Phone: +11234567892"
echo "   OTP: 123456"
echo "   Name: Mike Delivery Driver"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🚀 TO START THE APP:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd /Users/kp/Documents/GitHub/Quickzymobile/backend"
echo "  source venv/bin/activate"
echo "  uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd /Users/kp/Documents/GitHub/Quickzymobile/frontend"
echo "  yarn start"
echo "  Press 'i' for iOS simulator"
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "📖 Full testing guide: TESTING_GUIDE.md"
echo "═══════════════════════════════════════════════════════"
