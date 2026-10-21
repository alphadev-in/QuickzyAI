# Quickzy API Documentation

## Base URL
```
http://localhost:8001/api
```

## Complete API Endpoints

### 🔐 User Management

#### Create User
```http
POST /users
Content-Type: application/json

{
  "phone": "+1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer"
}
```

#### Get User by ID
```http
GET /users/{user_id}
```

#### Get User by Phone
```http
GET /users/phone/{phone}
```

#### Update User
```http
PUT /users/{user_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### Add Address
```http
POST /users/{user_id}/addresses
Content-Type: application/json

{
  "label": "Home",
  "street": "123 Main St",
  "apartment": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "instructions": "Ring doorbell twice"
}
```

#### Delete Address
```http
DELETE /users/{user_id}/addresses/{address_id}
```

#### Toggle Favorite Restaurant
```http
POST /users/{user_id}/favorites/{restaurant_id}
```

---

### 🍽️ Restaurant Management

#### Create Restaurant
```http
POST /restaurants
Content-Type: application/json

{
  "name": "Amazing Restaurant",
  "description": "Best food in town",
  "cuisineTypes": ["Italian", "Pizza"],
  "address": {...},
  "ownerId": "user_id",
  "deliveryFee": 2.99,
  "minimumOrder": 10.00,
  "estimatedDeliveryTime": "30-40 min"
}
```

#### Get All Restaurants (with filtering)
```http
GET /restaurants?search=pizza&cuisine=Italian&sortBy=rating&skip=0&limit=20

Query Parameters:
- search: Search in name, cuisine, description
- cuisine: Filter by cuisine type
- sortBy: rating | deliveryTime | deliveryFee
- skip: Pagination offset
- limit: Number of results
```

#### Get Restaurant by ID
```http
GET /restaurants/{restaurant_id}
```

#### Get Restaurants by Owner
```http
GET /restaurants/owner/{owner_id}
```

#### Update Restaurant Status
```http
PUT /restaurants/{restaurant_id}/status?is_open=true
```

---

### 📋 Menu Management

#### Create Menu Item
```http
POST /menu-items
Content-Type: application/json

{
  "restaurantId": "rest_id",
  "name": "Margherita Pizza",
  "description": "Classic tomato and mozzarella",
  "price": 12.99,
  "image": "base64_or_url",
  "category": "Pizza",
  "available": true,
  "isVeg": true,
  "spiceLevel": 0,
  "prepTime": 15,
  "customizations": [
    {
      "name": "Size",
      "options": ["Small", "Medium", "Large"],
      "type": "single",
      "required": true,
      "priceModifier": 0
    },
    {
      "name": "Extra Toppings",
      "options": ["Mushrooms", "Olives", "Peppers"],
      "type": "multiple",
      "required": false,
      "priceModifier": 1.50
    }
  ]
}
```

#### Get Menu Items by Restaurant
```http
GET /menu-items/restaurant/{restaurant_id}?category=Pizza
```

#### Get Single Menu Item
```http
GET /menu-items/{item_id}
```

#### Update Menu Item
```http
PUT /menu-items/{item_id}
Content-Type: application/json

{
  "price": 13.99,
  "available": true
}
```

#### Update Item Availability
```http
PUT /menu-items/{item_id}/availability?available=false
```

#### Delete Menu Item
```http
DELETE /menu-items/{item_id}
```

---

### 📦 Order Management

#### Create Order
```http
POST /orders
Content-Type: application/json

{
  "customerId": "user_id",
  "restaurantId": "rest_id",
  "restaurantName": "Amazing Restaurant",
  "items": [
    {
      "menuItemId": "item_id",
      "name": "Margherita Pizza",
      "price": 12.99,
      "quantity": 2,
      "customizations": {
        "Size": "Large",
        "Extra Toppings": ["Mushrooms", "Olives"]
      },
      "specialInstructions": "Extra cheese please"
    }
  ],
  "subtotal": 25.98,
  "deliveryFee": 2.99,
  "tax": 2.60,
  "discount": 5.00,
  "promoCode": "SAVE10",
  "total": 26.57,
  "paymentMethod": "card",
  "deliveryAddress": {...},
  "customerPhone": "+1234567890",
  "customerName": "John Doe",
  "specialInstructions": "Ring doorbell"
}

Response includes:
- orderNumber: Unique order number (e.g., ORD-20260114-A3B4C5D6)
- Real-time notification sent to restaurant
```

#### Get Order by ID
```http
GET /orders/{order_id}
```

#### Get Customer Orders
```http
GET /orders/customer/{customer_id}
```

#### Get Restaurant Orders
```http
GET /orders/restaurant/{restaurant_id}?status=pending
```

#### Get Delivery Partner Orders
```http
GET /orders/delivery/{delivery_partner_id}
```

#### Get Available Orders for Delivery
```http
GET /orders/delivery/available/list
```

#### Update Order Status
```http
PUT /orders/{order_id}/status
Content-Type: application/json

{
  "status": "preparing",
  "preparationTime": 20,
  "deliveryPartnerId": "delivery_user_id"
}

Statuses:
- pending: Order placed
- accepted: Restaurant accepted
- preparing: Being prepared
- ready: Ready for pickup
- picked_up: Picked by delivery partner
- on_the_way: Out for delivery
- delivered: Delivered to customer
- cancelled: Order cancelled

Features:
- Automatic payment status update on delivery
- Real-time Socket.io updates
- Customer notifications
```

#### Cancel Order
```http
POST /orders/{order_id}/cancel
Content-Type: application/json

{
  "reason": "Customer changed mind"
}

Features:
- Automatic refund to wallet if paid
- Cannot cancel delivered/cancelled orders
```

---

### 🎟️ Promo Codes

#### Create Promo Code
```http
POST /promo-codes
Content-Type: application/json

{
  "code": "SAVE20",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderValue": 15.00,
  "maxDiscount": 10.00,
  "validFrom": "2026-01-01T00:00:00",
  "validUntil": "2026-12-31T23:59:59",
  "usageLimit": 100,
  "applicableOn": "all",
  "restaurantIds": [],
  "isActive": true
}
```

#### Validate Promo Code
```http
GET /promo-codes/validate/SAVE20?order_value=50.00&restaurant_id=rest_id

Response:
{
  "valid": true,
  "discount": 10.00,
  "code": "SAVE20",
  "message": "You saved $10.00!"
}
```

---

### ⭐ Reviews & Ratings

#### Create Review
```http
POST /reviews
Content-Type: application/json

{
  "orderId": "order_id",
  "restaurantId": "rest_id",
  "customerId": "user_id",
  "customerName": "John Doe",
  "rating": 4.5,
  "comment": "Great food and fast delivery!",
  "foodRating": 5.0,
  "deliveryRating": 4.0,
  "images": ["base64_image_1", "base64_image_2"]
}

Features:
- Can only review delivered orders
- One review per order
- Automatically updates restaurant rating
```

#### Get Restaurant Reviews
```http
GET /reviews/restaurant/{restaurant_id}?limit=50
```

---

### 💬 Chat System

#### Get Order Chat Messages
```http
GET /chat/order/{order_id}
```

#### Send Chat Message
```http
POST /chat/message
Content-Type: application/json

{
  "orderId": "order_id",
  "senderId": "user_id",
  "senderType": "customer",
  "receiverId": "delivery_user_id",
  "message": "Where are you?"
}

Features:
- Real-time delivery via Socket.io
- Supports customer ↔ delivery partner
- Supports customer ↔ restaurant
```

---

### 🔔 Notifications

#### Get User Notifications
```http
GET /notifications/{user_id}
```

#### Mark Notification as Read
```http
PUT /notifications/{notification_id}/read
```

**Automatic Notifications Created For:**
- New orders (restaurant)
- Order status changes (customer)
- Messages (both parties)
- Promotions (all users)

---

### 📊 Analytics

#### Restaurant Analytics
```http
GET /analytics/restaurant/{restaurant_id}?days=7

Response:
{
  "totalOrders": 145,
  "totalRevenue": 3245.50,
  "avgOrderValue": 22.38,
  "statusBreakdown": {
    "delivered": 120,
    "preparing": 15,
    "cancelled": 10
  },
  "period": "Last 7 days"
}
```

#### Delivery Partner Analytics
```http
GET /analytics/delivery/{delivery_partner_id}?days=7

Response:
{
  "totalDeliveries": 87,
  "totalEarnings": 348.00,
  "avgEarningsPerDelivery": 4.00,
  "period": "Last 7 days"
}
```

---

### 🔄 Real-Time Features (Socket.io)

**Connect to Socket.io:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8001');

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

**Events:**

#### Join Order Room
```javascript
socket.emit('join_order_room', { orderId: 'order_123' });
```

#### Leave Order Room
```javascript
socket.emit('leave_order_room', { orderId: 'order_123' });
```

#### Update Delivery Location
```javascript
socket.emit('delivery_location_update', {
  orderId: 'order_123',
  location: {
    latitude: 40.7589,
    longitude: -73.9851
  }
});
```

#### Send Chat Message
```javascript
socket.emit('send_chat_message', {
  orderId: 'order_123',
  senderId: 'user_id',
  senderType: 'customer',
  receiverId: 'delivery_id',
  message: 'Hello!'
});
```

**Listen to Events:**

#### New Order (Restaurant)
```javascript
socket.on('new_order', (data) => {
  console.log('New order:', data);
  // { orderId, restaurantId, orderNumber }
});
```

#### Order Status Update (Customer)
```javascript
socket.on('order_status_update', (data) => {
  console.log('Status update:', data);
  // { orderId, status }
});
```

#### Location Update (Customer)
```javascript
socket.on('location_update', (data) => {
  console.log('Delivery location:', data);
  // { orderId, location: { latitude, longitude } }
});
```

#### New Chat Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // Full ChatMessage object
});
```

---

## Database Collections

### Users
```javascript
{
  phone: String,
  email: String,
  name: String,
  role: String,
  profileImage: String,
  addresses: [Address],
  paymentMethods: [PaymentMethod],
  wallet: {
    balance: Number,
    transactions: [Transaction]
  },
  favoriteRestaurants: [String],
  createdAt: Date
}
```

### Restaurants
```javascript
{
  name: String,
  description: String,
  image: String,
  coverImage: String,
  rating: Number,
  totalReviews: Number,
  cuisineTypes: [String],
  address: Address,
  ownerId: String,
  isOpen: Boolean,
  deliveryFee: Number,
  minimumOrder: Number,
  estimatedDeliveryTime: String,
  openingHours: Object,
  features: [String],
  promocode: String,
  createdAt: Date
}
```

### Menu Items
```javascript
{
  restaurantId: String,
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  available: Boolean,
  isVeg: Boolean,
  spiceLevel: Number,
  prepTime: Number,
  customizations: [CustomizationOption],
  rating: Number,
  reviewCount: Number
}
```

### Orders
```javascript
{
  orderNumber: String,
  customerId: String,
  restaurantId: String,
  restaurantName: String,
  deliveryPartnerId: String,
  items: [OrderItem],
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  discount: Number,
  promoCode: String,
  total: Number,
  paymentMethod: String,
  paymentStatus: String,
  status: String,
  deliveryAddress: Address,
  customerPhone: String,
  customerName: String,
  specialInstructions: String,
  estimatedDeliveryTime: String,
  preparationTime: Number,
  deliveryTime: Date,
  cancelReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Reviews
```javascript
{
  orderId: String,
  restaurantId: String,
  customerId: String,
  customerName: String,
  rating: Number,
  comment: String,
  foodRating: Number,
  deliveryRating: Number,
  images: [String],
  response: String,
  createdAt: Date
}
```

### Promo Codes
```javascript
{
  code: String,
  discountType: String,
  discountValue: Number,
  minOrderValue: Number,
  maxDiscount: Number,
  validFrom: Date,
  validUntil: Date,
  usageLimit: Number,
  usedCount: Number,
  applicableOn: String,
  restaurantIds: [String],
  isActive: Boolean
}
```

### Chat Messages
```javascript
{
  orderId: String,
  senderId: String,
  senderType: String,
  receiverId: String,
  message: String,
  timestamp: Date,
  read: Boolean
}
```

### Notifications
```javascript
{
  userId: String,
  title: String,
  body: String,
  type: String,
  data: Object,
  read: Boolean,
  createdAt: Date
}
```

---

## Features Implemented

### ✅ User Features
- Complete profile management
- Multiple address management
- Payment methods storage
- Wallet system with transactions
- Favorite restaurants

### ✅ Restaurant Features
- Full CRUD operations
- Advanced filtering (search, cuisine, sort)
- Open/close status
- Menu management with customizations
- Review system with auto-rating updates

### ✅ Menu Features
- Item customizations (size, toppings, etc.)
- Availability toggles
- Categories
- Veg/non-veg markers
- Spice levels
- Preparation time

### ✅ Order Features
- Complete order flow
- Unique order numbers
- Status tracking (8 states)
- Preparation time control
- Payment integration ready
- Promo code application
- Order cancellation with refunds
- Special instructions

### ✅ Promo Code System
- Percentage & flat discounts
- Min order value
- Max discount cap
- Usage limits
- Date validity
- Restaurant-specific codes
- Auto-validation

### ✅ Review System
- Order-based reviews
- Food & delivery ratings
- Image uploads
- Restaurant responses
- Auto-rating calculation

### ✅ Chat System
- Order-specific chats
- Customer ↔ Delivery
- Customer ↔ Restaurant
- Real-time via Socket.io
- Read receipts

### ✅ Notification System
- Automatic order updates
- Promotional notifications
- Message alerts
- Read/unread tracking

### ✅ Analytics
- Restaurant performance metrics
- Delivery partner earnings
- Order status breakdown
- Time-period filtering

### ✅ Real-Time Features
- Live order tracking
- Delivery location updates
- Chat messages
- Order status changes
- New order alerts

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error Response Format:
```json
{
  "detail": "Error message here"
}
```

---

## Testing Examples

### Test Complete Order Flow

1. **Create User:**
```bash
curl -X POST http://localhost:8001/api/users \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","name":"Test User","role":"customer"}'
```

2. **Get Restaurants:**
```bash
curl http://localhost:8001/api/restaurants
```

3. **Get Menu Items:**
```bash
curl http://localhost:8001/api/menu-items/restaurant/RESTAURANT_ID
```

4. **Validate Promo Code:**
```bash
curl "http://localhost:8001/api/promo-codes/validate/SAVE10?order_value=50"
```

5. **Create Order:**
```bash
curl -X POST http://localhost:8001/api/orders \
  -H "Content-Type: application/json" \
  -d '{...order_data...}'
```

6. **Update Order Status:**
```bash
curl -X PUT http://localhost:8001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing","preparationTime":20}'
```

7. **Create Review:**
```bash
curl -X POST http://localhost:8001/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","restaurantId":"REST_ID","customerId":"USER_ID","customerName":"Test User","rating":5,"comment":"Excellent!"}'
```

---

**API Version:** 2.0
**Last Updated:** January 14, 2026
**Total Endpoints:** 50+
**Real-time Events:** 8
**Database Collections:** 8
