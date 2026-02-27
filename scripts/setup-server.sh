#!/bin/bash

# CheckHost.top - Server Setup Script
# Works on Ubuntu 20.04/22.04+

set -e

echo "🚀 Starting server setup for CheckHost..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Prerequisites
echo "🛠 Installing prerequisites..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release nginx git ufw

# 3. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# 4. Install Docker Compose
echo "🍱 Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# 5. Configure Firewall
echo "🛡 Configuring Firewall (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Create Project Structure
echo "📂 Creating project directories..."
mkdir -p ~/checkhost/data
mkdir -p ~/checkhost/backups/db

echo "✅ Server setup complete!"
echo "⚠️  Please log out and log back in to apply docker group changes."
echo "👉 Next steps: Clone the repo into ~/checkhost, set up .env, and run 'docker compose up -d'"
