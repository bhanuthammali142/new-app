#!/bin/bash
# HostelOS Backend Initialization Script
# PostgreSQL version - uses psql client
# This script sets up the database and seeds default data

set -e

echo "🚀 HostelOS Backend Setup (PostgreSQL)"
echo "======================================"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
fi

# Ask for PostgreSQL credentials
read -p "PostgreSQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "PostgreSQL Port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "PostgreSQL User (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL Password: " DB_PASSWORD
echo ""

read -p "Database Name (default: hostel_management): " DB_NAME
DB_NAME=${DB_NAME:-hostel_management}

echo ""
echo "📝 Creating database and tables..."

# Create database and run schema (using psql)
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -f schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database and tables created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

echo ""
echo "🌱 Seeding default superadmin..."

# Run seed script
npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env with your database credentials:"
    echo "   DATABASE_URL=postgresql://$DB_USER:PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo "2. Run: npm start"
    echo ""
    echo "Login credentials:"
    echo "  Email: admin@hostel.com"
    echo "  Password: Bhanu@2006"
else
    echo "❌ Seed failed"
    exit 1
fi
