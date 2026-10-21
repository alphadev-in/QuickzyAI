import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import certifi

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where(), appName="my-app", tls=True, tlsAllowInvalidCertificates=True)
db = client[os.environ['DB_NAME']]

async def seed_complete_data():
    """Seed the database with complete test data including 3 test users"""
    
    print("🚀 Starting Quickzy Database Seeding...")
    print("=" * 60)
    
    # Clear existing data
    print("\n🗑️  Clearing existing data...")
    await db.users.delete_many({})
    await db.restaurants.delete_many({})
    await db.menu_items.delete_many({})
    await db.orders.delete_many({})
    print("✓ Database cleared")
    
    # ==================== CREATE TEST USERS ====================
    print("\n👥 Creating Test Users...")
    
    test_users = [
        {
            "phone": "+441234567890",
            "email": "customer@quickzy.test",
            "name": "John Customer",
            "role": "customer",
            "profileImage": None,
            "addresses": [
                {
                    "id": "addr_001",
                    "label": "Home",
                    "street": "123 Main Street",
                    "apartment": "Apt 4B",
                    "city": "London",
                    "state": "ENG",
                    "zipCode": "SW1A 0AA",
                    "latitude": 51.5074,
                    "longitude": -0.1278,
                    "instructions": "Ring doorbell twice"
                }
            ],
            "paymentMethods": [],
            "wallet": {"balance": 50.0, "transactions": []},
            "favoriteRestaurants": [],
            "createdAt": datetime.utcnow()
        },
        {
            "phone": "+441234567891",
            "email": "restaurant@quickzy.test",
            "name": "Sarah Restaurant Owner",
            "role": "restaurant",
            "profileImage": None,
            "addresses": [],
            "paymentMethods": [],
            "wallet": {"balance": 0.0, "transactions": []},
            "favoriteRestaurants": [],
            "createdAt": datetime.utcnow()
        },
        {
            "phone": "+441234567892",
            "email": "delivery@quickzy.test",
            "name": "Mike Delivery Driver",
            "role": "delivery",
            "profileImage": None,
            "addresses": [],
            "paymentMethods": [],
            "wallet": {"balance": 0.0, "transactions": []},
            "favoriteRestaurants": [],
            "createdAt": datetime.utcnow()
        }
    ]
    
    result = await db.users.insert_many(test_users)
    user_ids = [str(id) for id in result.inserted_ids]
    
    print(f"✓ Created {len(test_users)} test users")
    print(f"  📱 Customer: +441234567890 (John Customer)")
    print(f"  🏪 Restaurant: +441234567891 (Sarah Restaurant Owner)")
    print(f"  🚗 Delivery: +441234567892 (Mike Delivery Driver)")
    
    # ==================== CREATE RESTAURANTS ====================
    print("\n🍽️  Creating Restaurants...")
    
    restaurants = [
        {
            "name": "Pizza Palace",
            "description": "Best pizza in town with authentic Italian recipes",
            "image": None,
            "cuisineTypes": ["Italian", "Pizza"],
            "address": {
                "label": "Restaurant",
                "street": "456 Market St",
                "city": "London",
                "state": "ENG",
                "zipCode": "W1D 3QU",
                "latitude": 51.5154,
                "longitude": -0.1419
            },
            "ownerId": user_ids[1],  # Sarah's restaurant
            "rating": 4.5,
            "totalReviews": 245,
            "isOpen": True,
            "deliveryFee": 2.99,
            "minimumOrder": 15.0,
            "estimatedDeliveryTime": "30-40 min",
            "features": ["Fast Delivery", "Top Rated"],
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Burger Barn",
            "description": "Gourmet burgers and fries made with premium ingredients",
            "image": None,
            "cuisineTypes": ["American", "Burgers"],
            "address": {
                "label": "Restaurant",
                "street": "789 Mission St",
                "city": "London",
                "state": "ENG",
                "zipCode": "SE1 9SP",
                "latitude": 51.5033,
                "longitude": -0.1195
            },
            "ownerId": user_ids[1],  # Sarah's second restaurant
            "rating": 4.7,
            "totalReviews": 512,
            "isOpen": True,
            "deliveryFee": 1.99,
            "minimumOrder": 10.0,
            "estimatedDeliveryTime": "25-35 min",
            "features": ["Popular", "Budget Friendly"],
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Sushi Station",
            "description": "Fresh sushi and Japanese cuisine daily",
            "image": None,
            "cuisineTypes": ["Japanese", "Sushi"],
            "address": {
                "label": "Restaurant",
                "street": "321 Valencia St",
                "city": "London",
                "state": "ENG",
                "zipCode": "SW1H 0HW",
                "latitude": 51.4999,
                "longitude": -0.1333
            },
            "ownerId": user_ids[1],
            "rating": 4.8,
            "totalReviews": 892,
            "isOpen": True,
            "deliveryFee": 3.99,
            "minimumOrder": 20.0,
            "estimatedDeliveryTime": "40-50 min",
            "features": ["Premium", "Authentic"],
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Taco Time",
            "description": "Authentic Mexican tacos and burritos",
            "image": None,
            "cuisineTypes": ["Mexican", "Tacos"],
            "address": {
                "label": "Restaurant",
                "street": "567 Folsom St",
                "city": "London",
                "state": "ENG",
                "zipCode": "EC1V 9LN",
                "latitude": 51.5278,
                "longitude": -0.0877
            },
            "ownerId": user_ids[1],
            "rating": 4.3,
            "totalReviews": 156,
            "isOpen": True,
            "deliveryFee": 2.49,
            "minimumOrder": 12.0,
            "estimatedDeliveryTime": "20-30 min",
            "features": ["Quick Service"],
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Healthy Bowl",
            "description": "Fresh salads and healthy meal options",
            "image": None,
            "cuisineTypes": ["Healthy", "Salads", "Vegan"],
            "address": {
                "label": "Restaurant",
                "street": "890 Howard St",
                "city": "London",
                "state": "ENG",
                "zipCode": "WC2H 7LE",
                "latitude": 51.5126,
                "longitude": -0.1232
            },
            "ownerId": user_ids[1],
            "rating": 4.6,
            "totalReviews": 387,
            "isOpen": False,
            "deliveryFee": 3.49,
            "minimumOrder": 18.0,
            "estimatedDeliveryTime": "35-45 min",
            "features": ["Healthy", "Vegan Options"],
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Curry House",
            "description": "Authentic Indian cuisine with rich flavors",
            "image": None,
            "cuisineTypes": ["Indian", "Curry", "Vegetarian"],
            "address": {
                "label": "Restaurant",
                "street": "234 Geary St",
                "city": "London",
                "state": "ENG",
                "zipCode": "E1 6AN",
                "latitude": 51.5168,
                "longitude": -0.0731
            },
            "ownerId": user_ids[1],
            "rating": 4.4,
            "totalReviews": 623,
            "isOpen": True,
            "deliveryFee": 2.99,
            "minimumOrder": 15.0,
            "estimatedDeliveryTime": "35-45 min",
            "features": ["Spicy", "Vegetarian"],
            "createdAt": datetime.utcnow()
        }
    ]
    
    result = await db.restaurants.insert_many(restaurants)
    restaurant_ids = [str(id) for id in result.inserted_ids]
    print(f"✓ Created {len(restaurants)} restaurants")
    
    # ==================== CREATE MENU ITEMS ====================
    print("\n📋 Creating Menu Items...")
    
    menu_items = [
        # Pizza Palace Menu
        {
            "restaurantId": restaurant_ids[0],
            "name": "Margherita Pizza",
            "description": "Classic tomato sauce, fresh mozzarella, and basil",
            "price": 12.99,
            "category": "Pizza",
            "available": True,
            "isVeg": True,
            "spiceLevel": 0,
            "prepTime": 20,
            "customizations": [
                {
                    "name": "Size",
                    "options": ["Small", "Medium", "Large"],
                    "type": "single",
                    "required": True,
                    "priceModifier": 0
                },
                {
                    "name": "Extra Cheese",
                    "options": ["Yes"],
                    "type": "multiple",
                    "required": False,
                    "priceModifier": 2.00
                }
            ],
            "rating": 4.5,
            "reviewCount": 89
        },
        {
            "restaurantId": restaurant_ids[0],
            "name": "Pepperoni Pizza",
            "description": "Loaded with pepperoni and mozzarella",
            "price": 14.99,
            "category": "Pizza",
            "available": True,
            "isVeg": False,
            "spiceLevel": 1,
            "prepTime": 20,
            "customizations": [],
            "rating": 4.7,
            "reviewCount": 156
        },
        {
            "restaurantId": restaurant_ids[0],
            "name": "Caesar Salad",
            "description": "Fresh romaine lettuce with caesar dressing",
            "price": 8.99,
            "category": "Salads",
            "available": True,
            "isVeg": True,
            "spiceLevel": 0,
            "prepTime": 10,
            "customizations": [],
            "rating": 4.3,
            "reviewCount": 45
        },
        # Burger Barn Menu
        {
            "restaurantId": restaurant_ids[1],
            "name": "Classic Burger",
            "description": "Beef patty with lettuce, tomato, and cheese",
            "price": 10.99,
            "category": "Burgers",
            "available": True,
            "isVeg": False,
            "spiceLevel": 0,
            "prepTime": 15,
            "customizations": [
                {
                    "name": "Add-ons",
                    "options": ["Bacon", "Avocado", "Egg"],
                    "type": "multiple",
                    "required": False,
                    "priceModifier": 1.50
                }
            ],
            "rating": 4.6,
            "reviewCount": 234
        },
        {
            "restaurantId": restaurant_ids[1],
            "name": "Bacon Cheeseburger",
            "description": "Double patty with bacon and cheese",
            "price": 13.99,
            "category": "Burgers",
            "available": True,
            "isVeg": False,
            "spiceLevel": 0,
            "prepTime": 15,
            "customizations": [],
            "rating": 4.8,
            "reviewCount": 312
        },
        {
            "restaurantId": restaurant_ids[1],
            "name": "French Fries",
            "description": "Crispy golden fries",
            "price": 4.99,
            "category": "Sides",
            "available": True,
            "isVeg": True,
            "spiceLevel": 0,
            "prepTime": 8,
            "customizations": [],
            "rating": 4.4,
            "reviewCount": 178
        },
        # Sushi Station Menu
        {
            "restaurantId": restaurant_ids[2],
            "name": "California Roll",
            "description": "Crab, avocado, and cucumber roll",
            "price": 9.99,
            "category": "Sushi Rolls",
            "available": True,
            "isVeg": False,
            "spiceLevel": 0,
            "prepTime": 15,
            "customizations": [],
            "rating": 4.7,
            "reviewCount": 203
        },
        {
            "restaurantId": restaurant_ids[2],
            "name": "Spicy Tuna Roll",
            "description": "Fresh tuna with spicy mayo",
            "price": 11.99,
            "category": "Sushi Rolls",
            "available": True,
            "isVeg": False,
            "spiceLevel": 3,
            "prepTime": 15,
            "customizations": [],
            "rating": 4.9,
            "reviewCount": 287
        }
    ]
    
    result = await db.menu_items.insert_many(menu_items)
    print(f"✓ Created {len(menu_items)} menu items")
    
    # ==================== CREATE SAMPLE ORDER ====================
    print("\n📦 Creating Sample Order...")
    
    sample_order = {
        "orderNumber": "ORD-20260114-TEST001",
        "customerId": user_ids[0],  # John Customer
        "restaurantId": restaurant_ids[0],  # Pizza Palace
        "restaurantName": "Pizza Palace",
        "deliveryPartnerId": user_ids[2],  # Mike Delivery
        "items": [
            {
                "menuItemId": str(result.inserted_ids[0]),
                "name": "Margherita Pizza",
                "price": 12.99,
                "quantity": 2,
                "customizations": {"Size": "Large", "Extra Cheese": True},
                "specialInstructions": "Extra crispy please"
            }
        ],
        "subtotal": 25.98,
        "deliveryFee": 2.99,
        "tax": 2.60,
        "discount": 0,
        "total": 31.57,
        "paymentMethod": "card",
        "paymentStatus": "paid",
        "status": "on_the_way",
        "deliveryAddress": test_users[0]["addresses"][0],
        "customerPhone": "+441234567890",
        "customerName": "John Customer",
        "specialInstructions": "Ring doorbell twice",
        "estimatedDeliveryTime": "30 min",
        "preparationTime": 20,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    await db.orders.insert_one(sample_order)
    print("✓ Created 1 sample order")
    
    # ==================== SUMMARY ====================
    print("\n" + "=" * 60)
    print("✅ DATABASE SEEDING COMPLETE!")
    print("=" * 60)
    print("\n📊 Summary:")
    print(f"   Users: {len(test_users)}")
    print(f"   Restaurants: {len(restaurants)}")
    print(f"   Menu Items: {len(menu_items)}")
    print(f"   Orders: 1")
    
    print("\n🔐 Test Credentials:")
    print("\n1️⃣  CUSTOMER LOGIN:")
    print("   Phone: +441234567890")
    print("   OTP: Any 6 digits (e.g., 123456)")
    print("   Email: customer@quickzy.test")
    print("   Name: John Customer")
    
    print("\n2️⃣  RESTAURANT PARTNER LOGIN:")
    print("   Phone: +441234567891")
    print("   OTP: Any 6 digits (e.g., 123456)")
    print("   Email: restaurant@quickzy.test")
    print("   Name: Sarah Restaurant Owner")
    
    print("\n3️⃣  DELIVERY PARTNER LOGIN:")
    print("   Phone: +441234567892")
    print("   OTP: Any 6 digits (e.g., 123456)")
    print("   Email: delivery@quickzy.test")
    print("   Name: Mike Delivery Driver")
    
    print("\n💡 Testing Tips:")
    print("   • All OTPs are simulated - use any 6-digit code")
    print("   • Customer has $50 wallet balance")
    print("   • Restaurant owner manages 6 restaurants")
    print("   • Delivery partner has 1 active delivery")
    print("   • Sample order is 'on_the_way' status")
    
    print("\n🚀 Ready to test Quickzy!")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    asyncio.run(seed_complete_data())
