#!/bin/bash

echo "🔧 Starting Backend with Correct Database..."
echo ""

# Unset the wrong DATABASE_URL environment variable
unset DATABASE_URL

# Export the correct DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_V4AeyDqLG6Kv@ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "✅ Using correct database: ep-hidden-glade"
echo ""

# Start the backend
npm run dev
