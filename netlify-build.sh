#!/bin/bash

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ Missing required environment variables"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clear cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# Build with verbose output
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"