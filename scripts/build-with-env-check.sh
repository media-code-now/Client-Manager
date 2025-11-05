#!/bin/bash

echo "🔍 Checking environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
else
    echo "✅ DATABASE_URL is set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set" 
    exit 1
else
    echo "✅ JWT_SECRET is set"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ JWT_REFRESH_SECRET is not set"
    exit 1
else
    echo "✅ JWT_REFRESH_SECRET is set"
fi

echo "🎉 All environment variables are properly configured!"
echo "🚀 Proceeding with build..."

npm run build