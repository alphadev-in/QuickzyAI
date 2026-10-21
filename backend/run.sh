#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Add the current directory to the python path to ensure modules are found
export PYTHONPATH=$PYTHONPATH:.

# The WORKDIR in the Dockerfile is /app, so we are in the right place.

# Load environment variables from .env file if it exists (for local dev)
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Run the seed script to populate the database
python seed_data.py

# Get the port from the environment, with a default of 8080
PORT=${PORT:-8080}

# Start the uvicorn server, listening on all interfaces on the port assigned by Railway
echo "🚀 Starting server on port $PORT"
uvicorn server:app --host 0.0.0.0 --port $PORT
