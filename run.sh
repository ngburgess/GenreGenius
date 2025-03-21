#!/bin/bash

cd backend

if [ ! -d "env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv env
fi

if [ -f "env/bin/activate" ]; then
    source env/bin/activate
elif [ -f "env/Scripts/activate" ]; then
    source env/Scripts/activate
else
    echo "Error: Activation script not found."
    exit 1
fi

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Running Flask app..."

if [ -f "env/bin/python" ]; then
    env/bin/python app.py &
elif [ -f "env/Scripts/python" ]; then
    env/Scripts/python app.py &
else
    echo "Error: Python installation not found."
    exit 1
fi

cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting React app..."
npm start
REACT_PID=$!

cleanup() {
    kill $REACT_PID
}

trap cleanup EXIT

wait