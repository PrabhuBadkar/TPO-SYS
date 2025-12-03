#!/bin/bash

# Fix Database Connection Script
# This script updates the database schema to match Prisma models

echo "🔧 Fixing Database Connection..."
echo ""

# Step 1: Unset conflicting environment variable
echo "Step 1: Removing conflicting DATABASE_URL environment variable..."
unset DATABASE_URL

# Step 2: Export correct database URL
echo "Step 2: Setting correct database URL..."
export DATABASE_URL="postgresql://neondb_owner:npg_V4AeyDqLG6Kv@ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Step 3: Push schema to database
echo "Step 3: Pushing schema to database..."
npx prisma db push --accept-data-loss

# Step 4: Generate Prisma Client
echo "Step 4: Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Done! Now restart your backend server:"
echo "   npm run dev"
