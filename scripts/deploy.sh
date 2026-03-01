#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code from Git..."
git pull origin main

# 2. Rebuild and restart Docker containers
echo "🏗️ Rebuilding Docker containers..."
docker compose build app
docker compose up -d app

echo "✅ Deployment successful!"
echo "📡 Next steps:"
echo "1. Go to your Admin Panel -> Settings"
echo "2. Find 'Database Operations' section"
echo "3. Click 'Repair DB & Seed FAQs' button"
echo ""
echo "Or visit: https://yourdomain.com/api/admin/master-setup"
