# 🚀 Quickzy - Quick Start on Mac (5 Minutes)

## 📋 Prerequisites (One-Time Setup)

### 1. Install Basic Tools
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js, Python, and MongoDB
brew install node python@3.11 mongodb-community

# Install Yarn
npm install -g yarn

# Start MongoDB service
brew services start mongodb-community
```

### 2. Install iOS Development Tools
```bash
# Install Xcode from App Store (takes 30-60 min)
# After Xcode installation:
xcode-select --install

# Install CocoaPods for iOS
sudo gem install cocoapods

# Install Expo CLI
npm install -g expo-cli
```

---

## 🎯 Running the App (Every Time)

### Step 1: Download the Project
```bash
# Navigate to where you downloaded/cloned Quickzy
cd /path/to/quickzy/app
```

### Step 2: Setup Backend (First Time Only)
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database with sample data
python seed_data.py
```

### Step 3: Start Backend
```bash
# Make sure you're in backend folder with venv activated
# You should see (venv) in terminal prompt

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**✅ Backend Running!** Leave this terminal open.

Test it: Open http://localhost:8001/api/health in browser

---

### Step 4: Setup Frontend (First Time Only)
```bash
# Open NEW terminal window (keep backend running)
cd /path/to/quickzy/app/frontend

# Install dependencies (takes 5-10 min first time)
yarn install

# Install iOS pods
cd ios
pod install
cd ..
```

### Step 5: Start Frontend
```bash
# Make sure you're in frontend folder
expo start
# or
yarn start
```

**✅ Metro Bundler Running!** You'll see options to run on different platforms.

---

## 📱 Running on iOS Simulator

### Option 1: Press 'i' (Easiest)
```bash
# After running 'expo start', press 'i' in terminal
# iOS simulator will open automatically
```

### Option 2: Use Yarn Command
```bash
# In frontend folder
yarn ios
```

### Option 3: Using Xcode
```bash
cd ios
open Quickzy.xcworkspace

# In Xcode:
# 1. Select simulator (iPhone 15 Pro)
# 2. Press ⌘R or click Play button
```

---

## 📱 Running on Your iPhone (Physical Device)

### Method 1: Expo Go (No Build Required)
1. Install **Expo Go** from App Store
2. Run `expo start` on your Mac
3. Scan QR code with iPhone camera
4. App opens in Expo Go

### Method 2: Development Build (Native)
```bash
# In Xcode, select your connected iPhone
# Press Play button
# May need to set up signing (use your Apple ID)
```

---

## 🧪 Testing the App

1. **Sign Up Flow:**
   - Enter any phone number (e.g., +1234567890)
   - Enter any 6-digit OTP (e.g., 123456)
   - Add your email and name
   - Choose role: Customer, Restaurant, or Delivery

2. **Browse Restaurants:**
   - 6 sample restaurants loaded
   - Search for "pizza" or "burger"
   - Click on restaurants to view

3. **Test Different Roles:**
   - Customer: Browse, order, track
   - Restaurant: Manage orders, toggle status
   - Delivery: Accept deliveries, track earnings

---

## 🛠️ Common Issues & Quick Fixes

### Backend won't start
```bash
# Make sure MongoDB is running
brew services start mongodb-community

# Make sure venv is activated
source venv/bin/activate
```

### Frontend won't start
```bash
# Clear cache
cd frontend
yarn start --clear
```

### iOS Simulator not opening
```bash
# Reset simulators
xcrun simctl shutdown all
xcrun simctl erase all

# Try again
yarn ios
```

### "Port 8001 already in use"
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9

# Start backend again
```

### Pod install fails
```bash
cd frontend/ios
pod deintegrate
pod install --repo-update
cd ..
```

---

## 📂 Simple File Structure

```
app/
├── backend/              # Python FastAPI server
│   ├── server.py        # Main API (running on 8001)
│   ├── seed_data.py     # Sample data loader
│   └── .env             # Backend config
│
├── frontend/            # React Native Expo app
│   ├── app/            # App screens
│   ├── ios/            # Native iOS code
│   ├── android/        # Native Android code
│   └── .env            # Frontend config
```

---

## 💡 Daily Development Workflow

**Terminal 1 - Backend:**
```bash
cd app/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd app/frontend
yarn start
```

Press **'i'** to open iOS simulator, or scan QR for physical device.

---

## 🎨 What You Can Do Now

### As Customer:
- ✅ Browse 6 sample restaurants
- ✅ Search by cuisine
- ✅ View menu items
- ✅ Place orders (backend ready)
- ✅ Track order history

### As Restaurant:
- ✅ View dashboard
- ✅ Toggle open/closed
- ✅ Manage orders
- ✅ View statistics

### As Delivery Partner:
- ✅ Toggle online/offline
- ✅ View available deliveries
- ✅ Track earnings

---

## 🔥 Next Steps

1. **Add Google Maps API key** for real location features
2. **Add Stripe keys** for real payments
3. **Build production app** for App Store

---

## 📞 Quick Commands Cheat Sheet

```bash
# Start everything
brew services start mongodb-community    # Start DB
cd backend && source venv/bin/activate   # Activate Python
uvicorn server:app --reload              # Start backend
# New terminal:
cd frontend && yarn start                # Start frontend

# Stop everything
Ctrl+C in backend terminal               # Stop backend
Ctrl+C in frontend terminal              # Stop frontend
brew services stop mongodb-community     # Stop DB (optional)

# Reset/Clean
cd frontend && yarn start --clear        # Clear Metro cache
cd backend && python seed_data.py        # Reload sample data
```

---

## ✅ Success Checklist

- [ ] MongoDB running (`brew services list`)
- [ ] Backend responding (`curl http://localhost:8001/api/health`)
- [ ] Frontend Metro bundler running
- [ ] iOS simulator showing app
- [ ] Can sign up and browse restaurants

---

## 🆘 Need Help?

**Backend Issues:**
- Check MongoDB: `brew services list`
- Check port: `lsof -i :8001`
- Check logs in terminal where uvicorn is running

**Frontend Issues:**
- Check Metro bundler logs
- Try `yarn start --clear`
- Check iOS simulator logs

**Database Issues:**
- Restart MongoDB: `brew services restart mongodb-community`
- Reseed data: `python seed_data.py`

---

## 🎉 You're Ready!

The app is running locally on your Mac. Start developing and testing!

**Pro Tip:** Keep both terminals (backend & frontend) open and visible so you can see logs in real-time.

---

**Documentation:**
- Full setup guide: `MAC_SETUP_GUIDE.md`
- API documentation: `API_DOCUMENTATION.md`
- Build guide: `BUILD_GUIDE.md`
