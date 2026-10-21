# 🧪 Quickzy Complete Testing Guide

## 🚀 Quick Start - Fix Network Error First!

### Step 1: Update Your Frontend .env File

On your Mac, edit the frontend `.env` file:

```bash
cd /Users/kp/Documents/GitHub/Quickzymobile/frontend
```

**Create/Edit `.env` file:**
```bash
# For iOS Simulator (use localhost)
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001

# For Physical iPhone/Android Device (use your Mac's IP)
# Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
```

**To find your Mac's IP address:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: inet 192.168.1.100
```

### Step 2: Restart Expo
```bash
# Stop Expo (Ctrl+C)
# Clear cache and restart
yarn start --clear
```

---

## 👥 Test Users Created

### 1️⃣ CUSTOMER - John Customer
```
Phone: +11234567890
Email: customer@quickzy.test
Name: John Customer
Wallet Balance: $50.00
Role: Customer
```

### 2️⃣ RESTAURANT OWNER - Sarah Restaurant Owner
```
Phone: +11234567891
Email: restaurant@quickzy.test
Name: Sarah Restaurant Owner
Manages: 6 Restaurants
Role: Restaurant Partner
```

### 3️⃣ DELIVERY PARTNER - Mike Delivery Driver
```
Phone: +11234567892
Email: delivery@quickzy.test
Name: Mike Delivery Driver
Active Deliveries: 1 order
Role: Delivery Partner
```

**OTP for All Users:** Any 6-digit code (e.g., 123456)

---

## 🗄️ Seed Database with Test Data

```bash
cd /Users/kp/Documents/GitHub/Quickzymobile/backend

# Make sure MongoDB is running
brew services start mongodb-community

# Activate virtual environment
source venv/bin/activate

# Run seed script
python seed_data.py
```

**Expected Output:**
```
🚀 Starting Quickzy Database Seeding...
✓ Database cleared
✓ Created 3 test users
  📱 Customer: +11234567890 (John Customer)
  🏪 Restaurant: +11234567891 (Sarah Restaurant Owner)
  🚗 Delivery: +11234567892 (Mike Delivery Driver)
✓ Created 6 restaurants
✓ Created 8 menu items
✓ Created 1 sample order
✅ DATABASE SEEDING COMPLETE!
```

---

## 📱 Testing Scenarios

### 🛒 Scenario 1: Customer Order Flow

**As John Customer:**

1. **Login:**
   - Phone: `+11234567890`
   - OTP: `123456` (any 6 digits)
   - Skip email/name (already pre-filled)

2. **Browse Restaurants:**
   - ✅ See 6 restaurants
   - ✅ Search for "pizza"
   - ✅ Filter by cuisine type
   - ✅ Check ratings and delivery times

3. **View Restaurant Details:**
   - Tap on "Pizza Palace"
   - ✅ See menu items (Margherita Pizza, Pepperoni Pizza, Caesar Salad)
   - ✅ View prices and descriptions

4. **Place Order:**
   - Add Margherita Pizza to cart
   - Customize: Select size, add extra cheese
   - ✅ View cart total
   - ✅ Apply promo code (if available)
   - Proceed to checkout
   - Select delivery address
   - Choose payment method
   - Confirm order

5. **Track Order:**
   - ✅ View order in "My Orders"
   - ✅ Check order status
   - ✅ See estimated delivery time
   - ✅ Track on map (mock data)

6. **View Profile:**
   - ✅ Check wallet balance ($50)
   - ✅ View order history
   - ✅ Manage addresses

---

### 🏪 Scenario 2: Restaurant Partner Flow

**As Sarah Restaurant Owner:**

1. **Login:**
   - Phone: `+11234567891`
   - OTP: `123456`

2. **Dashboard:**
   - ✅ See total orders today
   - ✅ View revenue statistics
   - ✅ Check 6 managed restaurants

3. **Manage Restaurants:**
   - ✅ Toggle restaurant status (Open/Closed)
   - ✅ View active orders for each restaurant
   - ✅ See customer details

4. **Order Management:**
   - View new orders
   - ✅ Accept orders
   - ✅ Update preparation status
   - ✅ Set preparation time (20 min)
   - Mark as "ready for pickup"

5. **Menu Management:**
   - ✅ View menu items
   - ✅ Toggle item availability
   - ✅ Update prices (future feature)
   - ✅ Add new items (future feature)

6. **Analytics:**
   - ✅ View sales report
   - ✅ Check popular items
   - ✅ See customer ratings

---

### 🚗 Scenario 3: Delivery Partner Flow

**As Mike Delivery Driver:**

1. **Login:**
   - Phone: `+11234567892`
   - OTP: `123456`

2. **Dashboard:**
   - ✅ See 1 active delivery
   - ✅ Check total deliveries
   - ✅ View earnings ($0 - just started)

3. **Go Online:**
   - ✅ Toggle "Online" status
   - ✅ See available orders

4. **Accept Order:**
   - View available deliveries
   - Check delivery address and payment
   - ✅ Accept order
   - ✅ View pickup location (Pizza Palace)
   - ✅ View delivery location (John's address)

5. **Navigate:**
   - ✅ Get directions to restaurant
   - ✅ Confirm pickup
   - ✅ Navigate to customer
   - ✅ Update location in real-time

6. **Complete Delivery:**
   - Arrive at customer location
   - ✅ Mark as delivered
   - ✅ See updated earnings
   - ✅ View delivery history

---

## 🧪 Complete Test Checklist

### Backend API Tests
```bash
# Health check
curl http://localhost:8001/api/health

# Get restaurants
curl http://localhost:8001/api/restaurants

# Search restaurants
curl "http://localhost:8001/api/restaurants?search=pizza"

# Get menu items
curl http://localhost:8001/api/menu-items/restaurant/<RESTAURANT_ID>

# Get user by phone
curl http://localhost:8001/api/users/phone/+11234567890
```

### Frontend Tests

#### ✅ Authentication
- [ ] Sign up with all 3 users
- [ ] Phone number validation
- [ ] OTP verification (any 6 digits)
- [ ] Email collection
- [ ] Role selection
- [ ] Auto-navigate to correct dashboard

#### ✅ Customer Features
- [ ] Browse restaurants
- [ ] Search functionality
- [ ] Filter by cuisine
- [ ] Restaurant details page
- [ ] View menu with customizations
- [ ] Add to cart
- [ ] View cart total
- [ ] Checkout flow
- [ ] Order tracking
- [ ] View order history
- [ ] Profile management
- [ ] Wallet balance display

#### ✅ Restaurant Features
- [ ] Dashboard statistics
- [ ] View all restaurants
- [ ] Toggle open/closed status
- [ ] View incoming orders
- [ ] Accept orders
- [ ] Update order status
- [ ] Set preparation time
- [ ] Menu item availability toggle
- [ ] View analytics

#### ✅ Delivery Features
- [ ] Online/offline toggle
- [ ] View available orders
- [ ] Accept delivery
- [ ] View pickup location
- [ ] View delivery address
- [ ] Mock navigation
- [ ] Update order status
- [ ] Complete delivery
- [ ] View earnings
- [ ] Delivery history

---

## 🐛 Common Issues & Solutions

### Issue 1: Network Error
**Error:** `Error creating user: [AxiosError: Network Error]`

**Solution:**
```bash
# Update frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001

# Restart Expo
yarn start --clear
```

### Issue 2: MongoDB Not Running
**Error:** `Connection refused localhost:27017`

**Solution:**
```bash
brew services start mongodb-community
```

### Issue 3: Backend Not Starting
**Solution:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Issue 4: No Test Data
**Solution:**
```bash
cd backend
source venv/bin/activate
python seed_data.py
```

### Issue 5: App Not Loading on Simulator
**Solution:**
```bash
cd frontend
rm -rf node_modules .expo
yarn install
yarn start --clear
# Press 'i' for iOS simulator
```

---

## 📊 Test Data Summary

### Restaurants (6 total):
1. **Pizza Palace** - Italian, Pizza - Open
2. **Burger Barn** - American, Burgers - Open
3. **Sushi Station** - Japanese, Sushi - Open
4. **Taco Time** - Mexican, Tacos - Open
5. **Healthy Bowl** - Healthy, Salads - Closed
6. **Curry House** - Indian, Curry - Open

### Menu Items (8 total):
- Pizza Palace: Margherita Pizza, Pepperoni Pizza, Caesar Salad
- Burger Barn: Classic Burger, Bacon Cheeseburger, French Fries
- Sushi Station: California Roll, Spicy Tuna Roll

### Sample Order:
- Customer: John (+11234567890)
- Restaurant: Pizza Palace
- Items: 2x Margherita Pizza (Large, Extra Cheese)
- Total: $31.57
- Status: On The Way
- Delivery Partner: Mike

---

## 🎯 Testing Workflow (Recommended Order)

### Day 1: Backend & Customer App
1. Seed database
2. Test backend APIs with curl
3. Login as Customer
4. Browse restaurants
5. View restaurant details
6. Test search and filters

### Day 2: Order Flow
1. Login as Customer
2. Add items to cart
3. Place order
4. Login as Restaurant Owner
5. Accept order
6. Update order status

### Day 3: Delivery Flow
1. Login as Delivery Partner
2. Go online
3. View available orders
4. Accept delivery
5. Update delivery status
6. Complete delivery

### Day 4: Complete Flow
1. Customer places order
2. Restaurant accepts and prepares
3. Delivery partner picks up
4. Customer tracks in real-time
5. Delivery completes
6. Customer leaves review

---

## 💡 Pro Tips

1. **Test in Multiple Tabs/Windows:**
   - Keep customer view in one browser/simulator
   - Restaurant dashboard in another
   - Delivery partner in third
   - See real-time updates!

2. **Use Real Phone for Testing:**
   - Find Mac IP: `ifconfig | grep "inet "`
   - Update .env: `EXPO_PUBLIC_BACKEND_URL=http://192.168.1.X:8001`
   - Install Expo Go on iPhone
   - Scan QR code

3. **Test Socket.io Real-time:**
   - Open multiple simulators
   - Place order as customer
   - See notification on restaurant dashboard
   - Accept order and watch status update on customer side

4. **Debug with Backend Logs:**
   - Watch backend terminal for API calls
   - Check for errors in uvicorn logs
   - Use `curl` to test APIs directly

5. **Clear Cache When Needed:**
   ```bash
   # Backend
   cd backend && rm -rf __pycache__

   # Frontend
   cd frontend && yarn start --clear
   ```

---

## 📱 Screenshots to Test

Take screenshots at each stage:
1. Login screen
2. OTP verification
3. Role selection
4. Customer home (restaurant list)
5. Restaurant details
6. Cart screen
7. Order confirmation
8. Order tracking
9. Restaurant dashboard
10. Delivery partner dashboard

---

## ✅ Success Criteria

Your testing is successful when:
- [x] All 3 users can login
- [x] Customer can browse restaurants
- [x] Customer can view menu items
- [x] Orders appear on restaurant dashboard
- [x] Delivery partner can see assigned order
- [x] Order status updates reflect in real-time
- [x] All screens render correctly
- [x] No network errors
- [x] Backend APIs respond correctly

---

## 🚀 Next Steps After Testing

1. Add real Google Maps integration
2. Add real Stripe payments
3. Implement Socket.io frontend connection
4. Add push notifications
5. Complete cart & checkout UI
6. Add restaurant detail page
7. Implement chat feature
8. Add review system UI

---

**Happy Testing! 🎉**

For issues, check:
- Backend logs in terminal
- Frontend Metro bundler logs
- MongoDB connection: `mongosh`
- API health: `curl http://localhost:8001/api/health`
