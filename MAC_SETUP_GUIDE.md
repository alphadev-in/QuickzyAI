# Running Quickzy Locally on Mac

## Complete Setup Guide for macOS

---

## Prerequisites

### 1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Required Tools
```bash
# Install Node.js and Yarn
brew install node
npm install -g yarn

# Install Python 3
brew install python@3.11

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Install Git (if not installed)
brew install git

# Install Xcode Command Line Tools
xcode-select --install
```

### 3. Install Development Tools

#### For iOS Development:
- Download and install **Xcode** from App Store (15.0+)
- Install CocoaPods:
```bash
sudo gem install cocoapods
```

#### For Android Development (Optional):
- Download **Android Studio** from https://developer.android.com/studio
- Install Android SDK (API 34)
- Set up Android emulator

### 4. Install Expo CLI
```bash
npm install -g expo-cli eas-cli
```

---

## Project Setup

### Step 1: Clone/Download the Project

If you have the project files, navigate to the project directory:
```bash
cd /path/to/quickzy
```

Or if downloading from a repository:
```bash
git clone <repository-url>
cd quickzy
```

---

## Backend Setup

### Step 1: Start MongoDB
```bash
# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
mongosh
# Type 'exit' to quit mongo shell
```

### Step 2: Set Up Python Virtual Environment
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
```bash
# Create .env file (if not exists)
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=quickzy_db
EOF
```

### Step 4: Seed Database (First Time Only)
```bash
python seed_data.py
```

### Step 5: Run Backend Server
```bash
# Make sure virtual environment is activated
# You should see (venv) in your terminal

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Backend should now be running at:** `http://localhost:8001`

Test it:
```bash
# Open new terminal
curl http://localhost:8001/api/health
```

---

## Frontend (Mobile App) Setup

### Step 1: Navigate to Frontend Directory
```bash
# Open new terminal window
cd frontend
```

### Step 2: Install Dependencies
```bash
# Install node modules
yarn install

# This may take 5-10 minutes
```

### Step 3: Configure Environment Variables
```bash
# Create/update .env file
cat > .env << 'EOF'
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
EOF
```

### Step 4: Install iOS Dependencies (iOS only)
```bash
cd ios
pod install
cd ..
```

### Step 5: Start Expo Development Server
```bash
yarn start
# or
expo start
```

---

## Running on Different Platforms

### Option 1: iOS Simulator (Recommended for Mac)

**Method A: Using Expo CLI**
```bash
# After running 'expo start', press 'i'
# Or run directly:
yarn ios
```

**Method B: Using Xcode**
```bash
# Open Xcode workspace
cd ios
open Quickzy.xcworkspace

# In Xcode:
# 1. Select a simulator (iPhone 15 Pro)
# 2. Click the Play button (⌘R)
```

### Option 2: Physical iOS Device

**Requirements:**
- Apple Developer account (free or paid)
- Device connected via USB
- Device in Developer Mode

**Steps:**
```bash
# Trust computer on your device
# In Xcode, select your device
# Click Play button
```

**If you get signing errors:**
1. Open `ios/Quickzy.xcworkspace` in Xcode
2. Click on "Quickzy" project in left sidebar
3. Select "Signing & Capabilities" tab
4. Choose your team under "Team"
5. Xcode will handle provisioning profiles

### Option 3: Expo Go App (Easiest)

**Steps:**
1. Install **Expo Go** from App Store on your iPhone/iPad
2. Run `expo start` on your Mac
3. Scan the QR code with your device camera
4. App will load in Expo Go

**Note:** Works great for development but has limitations with native modules.

### Option 4: Android Emulator

**Prerequisites:**
- Android Studio installed
- Android Virtual Device (AVD) created

**Steps:**
```bash
# Start Android emulator from Android Studio
# Then in terminal:
yarn android
# or press 'a' after running expo start
```

### Option 5: Physical Android Device

```bash
# Enable USB Debugging on your Android device
# Connect via USB
# Run:
yarn android
```

---

## Development Workflow

### Terminal Setup (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

**Terminal 3 - iOS/Android Build (Optional):**
```bash
cd frontend
yarn ios    # For iOS
# or
yarn android  # For Android
```

---

## Testing the App

### 1. Test Backend APIs
```bash
# Health check
curl http://localhost:8001/api/health

# Get restaurants
curl http://localhost:8001/api/restaurants

# Search restaurants
curl "http://localhost:8001/api/restaurants?search=pizza"
```

### 2. Test Frontend
- Open app on simulator/device
- Sign up with any phone number
- Enter any 6-digit OTP
- Add email and name
- Select role (Customer/Restaurant/Delivery)
- Explore the app!

---

## Building Native Apps for Testing

### iOS Build

**Development Build (For Testing):**
```bash
cd frontend

# Method 1: Local build with Xcode
cd ios
open Quickzy.xcworkspace
# Build and run from Xcode

# Method 2: Using Expo EAS (Recommended)
eas build --profile development --platform ios
```

**Production Build:**
```bash
# In Xcode:
# Product > Archive
# Follow distribution wizard
```

### Android Build

**Debug APK (For Testing):**
```bash
cd frontend/android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Install on connected device:**
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Release APK:**
```bash
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

---

## Common Issues & Solutions

### Issue 1: "Command not found: expo"
```bash
# Install expo-cli globally
npm install -g expo-cli

# Or use npx
npx expo start
```

### Issue 2: "Cannot connect to Metro bundler"
```bash
# Clear cache and restart
cd frontend
yarn start --clear
```

### Issue 3: Pod install fails (iOS)
```bash
cd frontend/ios
pod deintegrate
pod install --repo-update
```

### Issue 4: "Port 8001 already in use"
```bash
# Find and kill process using port 8001
lsof -ti:8001 | xargs kill -9

# Or use different port
uvicorn server:app --host 0.0.0.0 --port 8002 --reload
```

### Issue 5: MongoDB connection error
```bash
# Check if MongoDB is running
brew services list

# Restart MongoDB
brew services restart mongodb-community

# Or start manually
mongod --config /opt/homebrew/etc/mongod.conf
```

### Issue 6: "Python version error"
```bash
# Use Python 3.11
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 7: Xcode "No signing certificate"
1. Open Xcode → Preferences → Accounts
2. Add your Apple ID
3. Select your team in project settings
4. Xcode will manage certificates automatically

### Issue 8: "Unable to resolve module"
```bash
cd frontend
rm -rf node_modules
yarn cache clean
yarn install
```

### Issue 9: iOS simulator not showing app
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Restart expo
cd frontend
yarn start --clear
# Press 'i' to open in iOS simulator
```

---

## Hot Reload & Development

### Backend Hot Reload
- Backend automatically reloads on file changes (using `--reload` flag)
- Save any `.py` file and server will restart

### Frontend Hot Reload
- Expo provides fast refresh automatically
- Save any `.tsx` or `.ts` file
- Changes appear instantly on device/simulator

### Database Changes
- If you modify models, restart backend
- If you need fresh data, run `python seed_data.py` again

---

## Debugging

### Backend Debugging
```bash
# Add print statements
print(f"Debug: {variable}")

# Check logs
# Logs appear in terminal where uvicorn is running

# Use Python debugger
import pdb; pdb.set_trace()
```

### Frontend Debugging

**Using React Native Debugger:**
```bash
# Install
brew install --cask react-native-debugger

# Open debugger
open "rndebugger://set-debugger-loc?host=localhost&port=19000"

# In app, shake device and select "Debug"
```

**Using Browser DevTools:**
- Press `j` in terminal where Expo is running
- Opens Chrome debugger

**Console Logs:**
```typescript
// In your code
console.log('Debug:', data);

// Logs appear in terminal where expo is running
```

---

## Environment-Specific Configuration

### Development (Current Setup)
```bash
# Backend runs on localhost:8001
# Frontend connects to localhost
# Using local MongoDB
```

### Production Setup (Future)
```bash
# Backend on cloud server (AWS, Heroku, etc.)
# Update EXPO_PUBLIC_BACKEND_URL to production URL
# Use cloud MongoDB (MongoDB Atlas)
```

---

## Performance Tips

### Speed up development:
1. **Use iOS Simulator** - Faster than physical device for development
2. **Clear Metro cache** - If builds are slow: `yarn start --clear`
3. **Disable unnecessary features** - Comment out unused imports
4. **Use USB connection** - For physical devices instead of WiFi

---

## Next Steps After Local Setup

1. **Test all three user roles:**
   - Sign up as Customer
   - Sign up as Restaurant (different phone)
   - Sign up as Delivery Partner (different phone)

2. **Test order flow:**
   - Browse restaurants as customer
   - Create test orders
   - Accept orders as restaurant
   - Pick up as delivery partner

3. **Test real-time features:**
   - Open multiple simulators
   - Test order status updates
   - Test chat functionality

4. **Add Google Maps & Stripe:**
   - Get API keys
   - Follow integration guides

---

## Project Structure Quick Reference

```
quickzy/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── seed_data.py       # Database seeding
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── app/              # React Native screens
│   ├── store/            # Zustand state management
│   ├── services/         # API calls
│   ├── android/          # Native Android
│   ├── ios/              # Native iOS
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment
└── Documentation files
```

---

## Useful Commands Reference

```bash
# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Start Backend
cd backend && source venv/bin/activate && uvicorn server:app --reload

# Start Frontend
cd frontend && yarn start

# Run iOS
cd frontend && yarn ios

# Run Android
cd frontend && yarn android

# Clear cache
cd frontend && yarn start --clear

# Check what's running on port
lsof -i :8001

# View MongoDB data
mongosh quickzy_db
> db.restaurants.find()
> db.orders.find()
```

---

## Support Resources

- **Expo Docs:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **MongoDB Docs:** https://docs.mongodb.com/

---

## Quick Start Script (All-in-One)

Save this as `start-dev.sh`:

```bash
#!/bin/bash

# Start MongoDB
brew services start mongodb-community

# Start Backend in background
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
cd ../frontend
yarn start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
```

Make it executable:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

**You're all set! 🚀**

Run the backend, start the frontend, and open in iOS simulator to start developing!

For issues or questions, check the troubleshooting section above.
