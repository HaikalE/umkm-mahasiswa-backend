#!/bin/bash

# UMKM Mahasiswa Backend - Quick Setup Script
# This script will help you set up the development environment quickly

echo "🚀 UMKM Mahasiswa Backend - Quick Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "💡 Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    echo "💡 Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed or not in PATH"
    echo "💡 Please install PostgreSQL first:"
    echo "   - Windows: Download from https://www.postgresql.org/download/windows/"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo ""
    echo "🔄 Continuing setup anyway..."
else
    echo "✅ PostgreSQL detected"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file from template
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from development template..."
    cp .env.development .env
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists - skipping creation"
fi

# Create uploads directory
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
    echo "✅ Uploads directory created"
fi

# Database setup instructions
echo ""
echo "🗄️  DATABASE SETUP REQUIRED:"
echo "==============================="
echo "Before running the application, you need to set up PostgreSQL:"
echo ""
echo "1️⃣  Start PostgreSQL service:"
echo "   - Windows: Start PostgreSQL service from Services"
echo "   - macOS: brew services start postgresql"
echo "   - Linux: sudo systemctl start postgresql"
echo ""
echo "2️⃣  Create database:"
echo "   createdb umkm_mahasiswa_db"
echo ""
echo "3️⃣  Update .env file with your PostgreSQL password:"
echo "   - Open .env file"
echo "   - Change DB_PASSWORD=password to your actual PostgreSQL password"
echo ""
echo "4️⃣  Run the application:"
echo "   npm run dev"
echo ""

# Summary
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo "✅ Dependencies installed"
echo "✅ Environment file created (.env)"
echo "✅ Uploads directory created"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Set up PostgreSQL database (see instructions above)"
echo "2. Update .env file with your database password"
echo "3. Run: npm run dev"
echo ""
echo "📚 Additional commands:"
echo "   npm run dev        - Start development server"
echo "   npm run db:create  - Create database (if you have PostgreSQL running)"
echo "   npm run db:seed    - Seed database with sample data"
echo "   npm test           - Run tests"
echo ""
echo "🔍 Troubleshooting:"
echo "   - Check logs for specific error messages"
echo "   - Ensure PostgreSQL is running and accessible"
echo "   - Verify database credentials in .env file"
echo "   - Visit: http://localhost:3000/health to check server status"
echo ""
echo "🆘 Need help? Check the README.md file or create an issue on GitHub."