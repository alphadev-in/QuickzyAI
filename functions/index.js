
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { Storage } = require("@google-cloud/storage");
require("dotenv").config();

// Initialization
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(require("./serviceAccountKey.json")) });
  }
} catch (e) {
  console.error("Firebase Admin SDK initialization failed.", e);
}
const storage = new Storage();
const bucketName = process.env.GCLOUD_STORAGE_BUCKET || 'allshoplocaluk.appspot.com'; 
const bucket = storage.bucket(bucketName);


const uri = process.env.MONGODB_URI;
if (!uri) console.error("MongoDB URI not set.");
const client = new MongoClient(uri, {});
let db;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// DB Middleware
app.use(async (req, res, next) => {
  if (!db) {
    try {
      await client.connect();
      db = client.db();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error", error);
      return res.status(500).send({ error: "Database connection failed" });
    }
  }
  req.db = db;
  next();
});

// --- Auth Middleware ---
const authMiddleware = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).send({ error: 'Unauthorized' });
  }
};


// --- API Routes ---

app.get("/health", (req, res) => res.status(200).send({ status: "healthy" }));

// --- User Routes ---
app.post("/users", async (req, res) => {
  const { uid, email, name, role, phone } = req.body;
  if (!uid || !name || !role) return res.status(400).send({ error: "Missing required fields: uid, name, and role are required." });
  const newUser = { uid, email, name, role, phone: phone || null, addresses: [], wallet: { balance: 0 }, createdAt: new Date() };
  const result = await req.db.collection("users").insertOne(newUser);
  res.status(201).send({ ...newUser, _id: result.insertedId });
});

app.get("/users/me", authMiddleware, async (req, res) => {
    const user = await req.db.collection("users").findOne({ uid: req.user.uid });
    if (!user) return res.status(404).send({ error: "User not found" });
    res.status(200).send(user);
});

app.get("/users/:uid", async (req, res) => {
  const user = await req.db.collection("users").findOne({ uid: req.params.uid });
  if (!user) return res.status(404).send({ error: "User not found" });
  res.status(200).send(user);
});
app.get("/users/phone/:phone", async (req, res) => {
  const user = await req.db.collection("users").findOne({ phone: req.params.phone });
  if (!user) return res.status(404).send({ error: "User not found" });
  res.status(200).send(user);
});
app.put("/users/:uid", async (req, res) => {
  const result = await req.db.collection("users").updateOne({ uid: req.params.uid }, { $set: req.body });
  if (result.matchedCount === 0) return res.status(404).send({ error: "User not found" });
  res.status(200).send({ message: "User updated" });
});
app.post("/users/:uid/addresses", async (req, res) => {
  const newAddress = { _id: new ObjectId(), ...req.body };
  const result = await req.db.collection("users").updateOne({ uid: req.params.uid }, { $push: { addresses: newAddress } });
  if (result.matchedCount === 0) return res.status(404).send({ error: "User not found" });
  res.status(201).send(newAddress);
});
app.delete("/users/:uid/addresses/:addressId", async (req, res) => {
    const { uid, addressId } = req.params;
    const result = await req.db.collection("users").updateOne({ uid }, { $pull: { addresses: { _id: new ObjectId(addressId) } } });
    if (result.modifiedCount === 0) return res.status(404).send({ error: "Address not found" });
    res.status(200).send({ message: "Address deleted" });
});
app.get("/users/:uid/orders", async (req, res) => {
    const orders = await req.db.collection("orders").find({ userId: req.params.uid }).toArray();
    res.status(200).send(orders);
});
app.post("/users/:uid/image-upload-url", async (req, res) => {
    const { uid } = req.params;
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) return res.status(400).send({ error: "fileName and contentType are required" });

    const filePath = `user-profiles/${uid}/${fileName}`;
    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
    };

    try {
        const [url] = await bucket.file(filePath).getSignedUrl(options);
        res.status(200).send({ url, filePath });
    } catch (error) {
        console.error("Error creating signed URL:", error);
        res.status(500).send({ error: "Could not create upload URL" });
    }
});


// --- Restaurant Routes ---
app.post("/restaurants", authMiddleware, async (req, res) => {
    const newRestaurant = { ...req.body, ownerId: req.user.uid, menu: [], verified: false, rating: { average: 0, count: 0 }, createdAt: new Date() };
    const result = await req.db.collection("restaurants").insertOne(newRestaurant);
    res.status(201).send({ ...newRestaurant, _id: result.insertedId });
});
app.put("/restaurants/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
    const result = await req.db.collection("restaurants").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Restaurant not found" });
    res.status(200).send({ message: "Restaurant updated" });
});
app.get("/restaurants", async (req, res) => {
    const { cuisine, search } = req.query;
    let query = { verified: true };
    if (cuisine) query.cuisine = cuisine;
    if (search) query.name = { $regex: search, $options: "i" };
    const restaurants = await req.db.collection("restaurants").find(query).toArray();
    res.status(200).send(restaurants);
});
app.get("/restaurants/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
  const restaurant = await req.db.collection("restaurants").findOne({ _id: new ObjectId(req.params.id) });
  if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });
  res.status(200).send(restaurant);
});
app.get("/restaurants/:id/menu", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
    const restaurant = await req.db.collection("restaurants").findOne({ _id: new ObjectId(req.params.id) }, { projection: { menu: 1 } });
    res.status(200).send(restaurant ? restaurant.menu || [] : []);
});
app.post("/restaurants/:id/menu", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
    const newItem = { _id: new ObjectId(), ...req.body };
    const result = await req.db.collection("restaurants").updateOne({ _id: new ObjectId(req.params.id) }, { $push: { menu: newItem } });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Restaurant not found" });
    res.status(201).send(newItem);
});
app.put("/restaurants/:id/menu/:itemId", async (req, res) => {
    const { id, itemId } = req.params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) return res.status(400).send({ error: "Invalid ID" });
    const result = await req.db.collection("restaurants").updateOne({ _id: new ObjectId(id), "menu._id": new ObjectId(itemId) }, { $set: { "menu.$": { ...req.body, _id: new ObjectId(itemId) } } });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Item not found" });
    res.status(200).send({ message: "Menu item updated" });
});
app.delete("/restaurants/:id/menu/:itemId", async (req, res) => {
    const { id, itemId } = req.params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) return res.status(400).send({ error: "Invalid ID" });
    const result = await req.db.collection("restaurants").updateOne({ _id: new ObjectId(id) }, { $pull: { menu: { _id: new ObjectId(itemId) } } });
    if (result.modifiedCount === 0) return res.status(404).send({ error: "Item not found" });
    res.status(200).send({ message: "Menu item deleted" });
});
app.get("/restaurants/:id/orders", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
    const orders = await req.db.collection("orders").find({ restaurantId: req.params.id }).toArray();
    res.status(200).send(orders);
});
app.post("/restaurants/:id/image-upload-url", async (req, res) => {
    const { id } = req.params;
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) return res.status(400).send({ error: "fileName and contentType are required" });

    const filePath = `restaurant-images/${id}/${fileName}`;
    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
    };

    try {
        const [url] = await bucket.file(filePath).getSignedUrl(options);
        res.status(200).send({ url, filePath });
    } catch (error) {
        console.error("Error creating signed URL:", error);
        res.status(500).send({ error: "Could not create upload URL" });
    }
});

app.post("/restaurants/:id/reviews", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid Restaurant ID" });

    const { userId, rating, comment } = req.body;
    if (!userId || !rating) return res.status(400).send({ error: "Missing required fields" });

    // Create the new review
    const newReview = { 
        restaurantId: new ObjectId(id), 
        userId, 
        rating, 
        comment, 
        createdAt: new Date() 
    };
    const reviewResult = await req.db.collection("reviews").insertOne(newReview);

    // Update the restaurant's average rating
    const restaurant = await req.db.collection("restaurants").findOne({ _id: new ObjectId(id) });
    if (!restaurant) return res.status(404).send({ error: "Restaurant not found" });

    const currentRating = restaurant.rating || { average: 0, count: 0 };
    const newCount = currentRating.count + 1;
    const newAverage = ((currentRating.average * currentRating.count) + rating) / newCount;

    await req.db.collection("restaurants").updateOne(
        { _id: new ObjectId(id) },
        { $set: { rating: { average: newAverage, count: newCount } } }
    );

    res.status(201).send({ ...newReview, _id: reviewResult.insertedId });
});
app.get("/restaurants/:id/reviews", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid Restaurant ID" });
    const reviews = await req.db.collection("reviews").find({ restaurantId: new ObjectId(req.params.id) }).toArray();
    res.status(200).send(reviews);
});



// --- Order Routes ---
app.post("/orders", authMiddleware, async (req, res) => {
  const orderData = req.body;
  const newOrder = { ...orderData, userId: req.user.uid, status: "pending", createdAt: new Date(), rated: false };
  const result = await req.db.collection("orders").insertOne(newOrder);
  res.status(201).send({ ...newOrder, _id: result.insertedId });
});
app.get("/orders/available", async (req, res) => {
  const orders = await req.db.collection("orders").find({ status: "confirmed" }).toArray();
  res.status(200).send(orders);
});
app.get("/orders/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).send({ error: "Invalid ID" });
  const order = await req.db.collection("orders").findOne({ _id: new ObjectId(req.params.id) });
  if (!order) return res.status(404).send({ error: "Order not found" });
  res.status(200).send(order);
});
app.patch("/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
    const { status } = req.body;
    if (!status) return res.status(400).send({ error: "Status required" });
    const result = await req.db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: { status }});
    if (result.matchedCount === 0) return res.status(404).send({ error: "Order not found" });
    res.status(200).send({ message: "Order status updated" });
});

app.post("/orders/:id/rating", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });

    const { restaurantId, deliveryRating, foodRating } = req.body;
    if (!restaurantId || !deliveryRating || !foodRating) {
        return res.status(400).send({ error: "restaurantId, deliveryRating, and foodRating are required" });
    }

    // Mark the order as rated
    const orderUpdateResult = await req.db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: { rated: true, deliveryRating, foodRating } });
    if (orderUpdateResult.matchedCount === 0) {
        return res.status(404).send({ error: "Order not found" });
    }

    // You can also add logic here to update the delivery partner's average rating if you store that.

    res.status(200).send({ message: "Rating submitted successfully" });
});


// --- Delivery Partner Routes ---
app.post("/delivery-partners", async (req, res) => {
    const { uid, name, phone } = req.body;
    if (!uid || !name || !phone) return res.status(400).send({ error: "Missing required fields" });
    const newPartner = { uid, name, phone, isAvailable: false, vehicle: null, currentLocation: null, orderHistory: [], rating: { average: 0, count: 0 }, createdAt: new Date() };
    const result = await req.db.collection("delivery-partners").insertOne(newPartner);
    res.status(201).send({ ...newPartner, _id: result.insertedId });
});
app.get("/delivery-partners/:partnerId", async (req, res) => {
    const partner = await req.db.collection("delivery-partners").findOne({ uid: req.params.partnerId });
    if (!partner) return res.status(404).send({ error: "Partner not found" });
    res.status(200).send(partner);
});
app.put("/delivery-partners/:partnerId", async (req, res) => {
    const result = await req.db.collection("delivery-partners").updateOne({ uid: req.params.partnerId }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Partner not found" });
    res.status(200).send({ message: "Partner updated" });
});
app.put("/delivery-partners/:partnerId/availability", async (req, res) => {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') return res.status(400).send({ error: "isAvailable must be a boolean"});
    const result = await req.db.collection("delivery-partners").updateOne({ uid: req.params.partnerId }, { $set: { isAvailable } });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Partner not found" });
    res.status(200).send({ message: `Partner availability set to ${isAvailable}` });
});
app.post("/delivery-partners/:partnerId/orders/:orderId/accept", async (req, res) => {
    const { partnerId, orderId } = req.params;
    if (!ObjectId.isValid(orderId)) return res.status(400).send({ error: "Invalid Order ID" });

    const result = await req.db.collection("orders").findOneAndUpdate(
        { _id: new ObjectId(orderId), status: "confirmed" },
        { $set: { deliveryPartnerId: partnerId, status: "out-for-delivery" } },
        { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).send({ error: "Order not found or already taken" });
    await req.db.collection("delivery-partners").updateOne({ uid: partnerId }, { $push: { orderHistory: result.value._id } });
    res.status(200).send({ message: "Order accepted", order: result.value });
});
app.get("/delivery-partners/:partnerId/orders", async (req, res) => {
    const orders = await req.db.collection("orders").find({ deliveryPartnerId: req.params.partnerId }).toArray();
    res.status(200).send(orders);
});

// --- Admin Routes ---
const adminRouter = express.Router();
adminRouter.use(authMiddleware); // Secure all admin routes

adminRouter.get("/stats", async (req, res) => {
    const totalUsers = await req.db.collection("users").countDocuments();
    const totalRestaurants = await req.db.collection("restaurants").countDocuments();
    const totalOrders = await req.db.collection("orders").countDocuments();
    const salesPipeline = [
        { $match: { status: "delivered" } },
        { $group: { _id: null, totalSales: { $sum: "$total" } } }
    ];
    const sales = await req.db.collection("orders").aggregate(salesPipeline).toArray();
    res.status(200).send({ totalUsers, totalRestaurants, totalOrders, totalSales: sales[0]?.totalSales || 0 });
});
adminRouter.get("/users", async (req, res) => {
    const users = await req.db.collection("users").find({}).toArray();
    res.status(200).send(users);
});
adminRouter.get("/restaurants", async (req, res) => {
    const { verified } = req.query;
    let query = {};
    if (verified) query.verified = verified === 'true';
    const restaurants = await req.db.collection("restaurants").find(query).toArray();
    res.status(200).send(restaurants);
});
adminRouter.patch("/restaurants/:restaurantId/verify", async (req, res) => {
    const { restaurantId } = req.params;
    if (!ObjectId.isValid(restaurantId)) return res.status(400).send({ error: "Invalid ID" });
    const result = await req.db.collection("restaurants").updateOne({ _id: new ObjectId(restaurantId) }, { $set: { verified: true } });
    if (result.matchedCount === 0) return res.status(404).send({ error: "Restaurant not found" });
    res.status(200).send({ message: "Restaurant verified" });
});
adminRouter.get("/orders", async (req, res) => {
    const orders = await req.db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).send(orders);
});
adminRouter.post("/promos", async (req, res) => {
    const promoData = req.body;
    if (!promoData.code || !promoData.discount) return res.status(400).send({ error: "Missing required fields" });
    const result = await req.db.collection("promos").insertOne(promoData);
    res.status(201).send({ ...promoData, _id: result.insertedId });
});
adminRouter.get("/promos", async (req, res) => {
    const promos = await req.db.collection("promos").find({}).toArray();
    res.status(200).send(promos);
});
adminRouter.post("/settings", async (req, res) => {
    await req.db.collection("settings").updateOne({ _id: "platform_settings" }, { $set: req.body }, { upsert: true });
    res.status(200).send({ message: "Settings updated" });
});
adminRouter.get("/settings", async (req, res) => {
    const settings = await req.db.collection("settings").findOne({ _id: "platform_settings" });
    res.status(200).send(settings || {});
});

app.use("/admin", adminRouter);

// --- Export API ---
exports.api = functions.https.onRequest(app);
