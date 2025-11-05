#!/bin/bash

# CRM Auth Backend Setup Script
echo "🚀 Setting up CRM Auth Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the server"
fi

# Create database directory if it doesn't exist
mkdir -p database

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Make sure PostgreSQL is running: brew services start postgresql@14"
echo "3. Create auth_users table: psql -d mini_crm -f database/auth_users.sql"
echo "4. Start development server: npm run dev"
echo ""
echo "The server will run on http://localhost:5000"