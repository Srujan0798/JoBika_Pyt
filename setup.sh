#!/bin/bash

# JoBika Setup Script
# This script sets up the complete JoBika environment

echo "🚀 JoBika - Automated Setup"
echo "============================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Run database migration
echo "🗄️  Setting up database..."
python3 migrate_db.py
echo "✅ Database migration complete"
echo ""

# Copy environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env file from template..."
        cp .env.example .env
        echo "✅ .env file created (please update with your credentials)"
    else
        echo "⚠️  No .env.example found. Skipping .env creation."
    fi
else
    echo "✅ .env file already exists"
fi
echo ""

cd ..

echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Update backend/.env with your email credentials (optional)"
echo "   3. Start the server: cd backend && python3 server.py"
echo "   4. Open http://localhost:5000/app/index.html in your browser"
echo ""
echo "🚀 Happy job hunting!"
