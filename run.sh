#!/bin/bash
# Kill any process using port 5000 before starting
fuser -k 5000/tcp 2>/dev/null

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install flask
else
    source venv/bin/activate
fi

# Ensure flask is installed even if venv existed
if ! pip show flask > /dev/null; then
    echo "Installing Flask..."
    pip install flask
fi

echo "Starting Pond Dashboard..."
python3 app.py
