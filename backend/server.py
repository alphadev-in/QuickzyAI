
from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import socketio
import secrets

# Import routers and dependencies using absolute imports
from dependencies import get_db, db
from routers import auth as auth_router

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Firebase Admin SDK
try:
    cred_path = os.path.join(ROOT_DIR, 'serviceAccountKey.json')
    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")

# Setup Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', logger=True, engineio_logger=True)

# Create FastAPI app
app = FastAPI(title="Quickzy API", description="API for a food delivery platform supporting customers, restaurants, and delivery partners.")

# Create a main router with an /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Pydantic Models ====================

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    label: str
    street: str
    apartment: Optional[str] = None
    city: str
    state: str
    zipCode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uid: str # Firebase UID
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: str
    profileImage: Optional[str] = None
    addresses: List[Address] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    phone: Optional[str] = None

class UserCreate(BaseModel):
    uid: str
    email: Optional[EmailStr] = None
    name: str
    role: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profileImage: Optional[str] = None
    addresses: Optional[List[Address]] = None

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    description: str
    price: float
    category: str
    imageUrl: Optional[str] = None
    isAvailable: bool = True

class Restaurant(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    ownerId: str
    name: str
    description: str
    cuisine: str
    address: Address
    menu: List[MenuItem] = []
    rating: float = 0.0
    imageUrl: Optional[str] = None
    isAvailable: bool = True

class OrderItem(BaseModel):
    menuItemId: str
    name: str
    quantity: int
    price: float

class Order(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    customerId: str
    restaurantId: str
    deliveryId: Optional[str] = None
    items: List[OrderItem]
    totalAmount: float
    status: str # pending, confirmed, preparing, out-for-delivery, delivered, cancelled
    deliveryAddress: Address
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
# ==================== Socket.IO Events ====================

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket.IO client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket.IO client disconnected: {sid}")

@sio.on('join_room')
async def join_room(sid, room):
    sio.enter_room(sid, room)
    logger.info(f"Client {sid} joined room {room}")

@sio.on('leave_room')
async def leave_room(sid, room):
    sio.leave_room(sid, room)
    logger.info(f"Client {sid} left room {room}")

async def emit_order_update(order_id: str, data: dict):
    await sio.emit('order_update', data, room=f"order_{order_id}")

# ==================== User Routes ====================

@api_router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user_profile(user: UserCreate, db: Any = Depends(get_db)):
    user_dict = user.dict()
    user_dict["createdAt"] = datetime.utcnow()
    user_dict["addresses"] = []
    user_dict["phone"] = None
    await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"uid": user.uid})
    return created_user

@api_router.get("/users/{uid}", response_model=User)
async def get_user_profile(uid: str, db: Any = Depends(get_db)):
    user = await db.users.find_one({"uid": uid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{uid}", response_model=User)
async def update_user_profile(uid: str, updates: UserUpdate, db: Any = Depends(get_db)):
    update_data = updates.dict(exclude_unset=True)
    await db.users.update_one({"uid": uid}, {"$set": update_data})
    updated_user = await db.users.find_one({"uid": uid})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

# ==================== Restaurant Routes ====================

@api_router.post("/restaurants", response_model=Restaurant, status_code=status.HTTP_201_CREATED)
async def create_restaurant(restaurant: Restaurant, db: Any = Depends(get_db)):
    restaurant_dict = restaurant.dict(by_alias=True)
    await db.restaurants.insert_one(restaurant_dict)
    created_restaurant = await db.restaurants.find_one({"_id": restaurant.id})
    return created_restaurant
    
@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(db: Any = Depends(get_db)):
    restaurants = await db.restaurants.find().to_list(100)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str, db: Any = Depends(get_db)):
    restaurant = await db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

# ==================== Order Routes ====================

@api_router.post("/orders", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(order: Order, db: Any = Depends(get_db)):
    order_dict = order.dict(by_alias=True)
    await db.orders.insert_one(order_dict)
    await emit_order_update(str(order.id), {"status": "pending"})
    return order_dict

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, db: Any = Depends(get_db)):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: dict, db: Any = Depends(get_db)):
    new_status = status_update.get('status')
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": new_status}})
    await emit_order_update(order_id, {"status": new_status})
    return {"message": "Order status updated"}


# ==================== Delivery Routes ====================

@api_router.get("/deliveries/available", response_model=List[Order])
async def get_available_orders(db: Any = Depends(get_db)):
    available_orders = await db.orders.find({"status": "confirmed"}).to_list(100)
    return available_orders

@api_router.post("/deliveries/{order_id}/accept")
async def accept_order(order_id: str, delivery_info: dict, db: Any = Depends(get_db)):
    delivery_id = delivery_info.get('deliveryId')
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"deliveryId": delivery_id, "status": "out-for-delivery"}}
    )
    await emit_order_update(order_id, {"status": "out-for-delivery", "deliveryId": delivery_id})
    return {"message": "Order accepted for delivery"}

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add the routers to the main API router
api_router.include_router(auth_router.router)

# Add the API router to the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend's domain
    allow_credentials=True,
    allow_methods=["*"]
    ,
    allow_headers=["*"]
)

# Mount the Socket.IO app
app.mount("/socket.io", socketio.ASGIApp(sio))

@app.on_event("shutdown")
async def shutdown_db_client():
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
