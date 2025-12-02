#!/bin/bash

# =====================================================
# TPO Management System - Database Schema Application
# =====================================================
# Description: Apply all SQL schemas to NeonDB
# Usage: ./apply-schemas.sh
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection URL - must be set via environment variable
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}Please set DATABASE_URL:${NC}"
    echo -e "  export DATABASE_URL='postgresql://username:password@host/database?sslmode=require'"
    echo -e "${YELLOW}Or load from .env file:${NC}"
    echo -e "  source ../backend/.env"
    exit 1
fi

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║   TPO Management System - Database Setup             ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo -e "  macOS: brew install postgresql"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Failed to connect to database${NC}"
    echo -e "${YELLOW}Please check your DATABASE_URL${NC}"
    exit 1
fi

# Get database version
DB_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" | head -n 1)
echo -e "${BLUE}📊 Database: $DB_VERSION${NC}"
echo ""

# Schema files in order
SCHEMA_FILES=(
    "01_auth.sql"
    "02_students.sql"
    "03_recruiters.sql"
    "04_core.sql"
    "05_scheduling.sql"
    "06_notifications.sql"
    "07_audit.sql"
    "08_analytics.sql"
)

# Apply each schema
echo -e "${YELLOW}📝 Applying schemas...${NC}"
echo ""

SCHEMAS_DIR="$(dirname "$0")/schemas"
SUCCESS_COUNT=0
FAILED_COUNT=0

for schema_file in "${SCHEMA_FILES[@]}"; do
    schema_path="$SCHEMAS_DIR/$schema_file"
    
    if [ ! -f "$schema_path" ]; then
        echo -e "${YELLOW}⚠️  Skipping $schema_file (file not found)${NC}"
        continue
    fi
    
    echo -e "${BLUE}📄 Applying $schema_file...${NC}"
    
    if psql "$DATABASE_URL" -f "$schema_path" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $schema_file applied successfully${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Failed to apply $schema_file${NC}"
        ((FAILED_COUNT++))
        
        # Show error details
        echo -e "${YELLOW}Error details:${NC}"
        psql "$DATABASE_URL" -f "$schema_path" 2>&1 | tail -n 5
    fi
    echo ""
done

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Summary                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Successfully applied: $SUCCESS_COUNT schemas${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Failed: $FAILED_COUNT schemas${NC}"
fi
echo ""

# List all schemas
echo -e "${YELLOW}📊 Database schemas:${NC}"
psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name;"
echo ""

# List all tables
echo -e "${YELLOW}📋 Database tables:${NC}"
psql "$DATABASE_URL" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY schemaname, tablename;"
echo ""

# Final status
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All schemas applied successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some schemas failed to apply. Please check the errors above.${NC}"
    exit 1
fi
