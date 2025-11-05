#!/bin/bash

echo "🔍 Checking environment variables..."

# Check if DATABASE_URL is set, or if database components are set
if [ -z "$DATABASE_URL" ]; then
    echo "ℹ️  DATABASE_URL not set, checking components..."
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
        echo "❌ Database configuration incomplete. Need either DATABASE_URL or all of: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
        exit 1
    else
        echo "✅ Database components are set (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)"
    fi
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