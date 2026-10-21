# MongoDB Setup & Troubleshooting for Mac

## Issue: Connection Refused to MongoDB

**Error:** `pymongo.errors.ServerSelectionTimeoutError: localhost:27017: [Errno 61] Connection refused`

This means MongoDB is not running on your Mac.

---

## Solution: Start MongoDB

### Option 1: Start MongoDB as a Service (Recommended)
```bash
# Start MongoDB
brew services start mongodb-community

# Verify it's running
brew services list | grep mongodb

# You should see:
# mongodb-community started <username> ...
```

### Option 2: Start MongoDB Manually
```bash
# Start MongoDB in foreground (keeps running in current terminal)
mongod --config /opt/homebrew/etc/mongod.conf

# Or on Intel Mac:
mongod --config /usr/local/etc/mongod.conf
```

### Option 3: If MongoDB is not installed
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start it
brew services start mongodb-community
```

---

## Verify MongoDB is Running

### Method 1: Check Service Status
```bash
brew services list
```
Look for `mongodb-community` with status `started`.

### Method 2: Connect with mongosh
```bash
mongosh

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/
# Using MongoDB: x.x.x

# Type 'exit' to quit
```

### Method 3: Check if port 27017 is listening
```bash
lsof -i :27017

# You should see mongod process
```

---

## Common Issues & Fixes

### Issue 1: "mongodb-community: unknown"
**MongoDB is not installed**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### Issue 2: MongoDB won't start
**Check logs:**
```bash
tail -f /opt/homebrew/var/log/mongodb/mongo.log

# Or on Intel Mac:
tail -f /usr/local/var/log/mongodb/mongo.log
```

**Common fix - Remove lock file:**
```bash
rm /opt/homebrew/var/mongodb/mongod.lock

# Or on Intel Mac:
rm /usr/local/var/mongodb/mongod.lock

# Then restart:
brew services restart mongodb-community
```

### Issue 3: Permission issues
```bash
# Fix permissions
sudo chown -R $(whoami) /opt/homebrew/var/mongodb

# Or on Intel Mac:
sudo chown -R $(whoami) /usr/local/var/mongodb

# Restart MongoDB
brew services restart mongodb-community
```

### Issue 4: Port 27017 already in use
```bash
# Find what's using the port
lsof -i :27017

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Start MongoDB again
brew services start mongodb-community
```

---

## Step-by-Step: Complete Setup

### 1. Check if MongoDB is installed
```bash
brew list | grep mongodb
```

### 2. If not installed, install it
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### 3. Create data directory (if needed)
```bash
# For Apple Silicon (M1/M2):
sudo mkdir -p /opt/homebrew/var/mongodb
sudo chown -R $(whoami) /opt/homebrew/var/mongodb

# For Intel Mac:
sudo mkdir -p /usr/local/var/mongodb
sudo chown -R $(whoami) /usr/local/var/mongodb
```

### 4. Start MongoDB
```bash
brew services start mongodb-community
```

### 5. Verify it's running
```bash
brew services list | grep mongodb
mongosh  # Should connect successfully
```

### 6. Now run the seed script
```bash
cd /Users/kp/Documents/GitHub/Quickzymobile/backend
source venv/bin/activate
python seed_data.py
```

---

## Quick Commands Reference

```bash
# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community

# Check status
brew services list

# Connect to MongoDB shell
mongosh

# Check logs
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

---

## Alternative: Use Docker for MongoDB (Optional)

If you have Docker installed:
```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name quickzy-mongo mongo:latest

# Stop it
docker stop quickzy-mongo

# Start it again
docker start quickzy-mongo

# Remove it
docker rm quickzy-mongo
```

---

## After MongoDB is Running

1. **Test connection:**
```bash
mongosh
show dbs
exit
```

2. **Run seed script:**
```bash
cd backend
source venv/bin/activate
python seed_data.py
```

3. **Start backend:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

4. **Test API:**
```bash
curl http://localhost:8001/api/health
curl http://localhost:8001/api/restaurants
```

---

## Troubleshooting Checklist

- [ ] MongoDB installed: `brew list | grep mongodb`
- [ ] MongoDB service running: `brew services list`
- [ ] Port 27017 listening: `lsof -i :27017`
- [ ] Can connect with mongosh: `mongosh`
- [ ] No permission errors in logs
- [ ] Backend .env file has correct MONGO_URL

---

## Your Next Steps

1. Run: `brew services start mongodb-community`
2. Verify: `brew services list`
3. Test: `mongosh`
4. Seed: `python seed_data.py`
5. Start backend: `uvicorn server:app --reload`

MongoDB should now be running and the seed script should work! 🚀
