#!/bin/bash

# Deployment script for Hoffbot
# Usage: ./deploy.sh [production|development]

set -e  # Exit on any error

ENVIRONMENT=${1:-development}
SERVICE_NAME="hoffbot"
APP_DIR="/opt/bsky-hoffbot"
USER="hoffbot"

echo "🤖 Deploying Hoffbot to $ENVIRONMENT environment..."

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo "✓ Running as root"
    else
        echo "❌ This script must be run as root for production deployment"
        exit 1
    fi
}

# Function to create user if it doesn't exist
create_user() {
    if id "$USER" &>/dev/null; then
        echo "✓ User $USER already exists"
    else
        echo "Creating user $USER..."
        useradd --system --shell /bin/bash --home-dir $APP_DIR --create-home $USER
        echo "✓ User $USER created"
    fi
}

# Function to install Node.js if needed
install_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✓ Node.js is installed: $NODE_VERSION"
    else
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        apt-get install -y nodejs
        echo "✓ Node.js installed"
    fi
}

# Function to setup application
setup_app() {
    echo "Setting up application in $APP_DIR..."
    
    # Create directory and set ownership
    mkdir -p $APP_DIR
    chown -R $USER:$USER $APP_DIR
    
    # Copy files (assuming we're running from the project directory)
    cp -r src package.json tsconfig.json $APP_DIR/
    cp -r resources $APP_DIR/ 2>/dev/null || echo "Resources directory not found"
    
    # Create logs directory
    mkdir -p $APP_DIR/logs
    chown -R $USER:$USER $APP_DIR/logs
    
    # Install dependencies
    cd $APP_DIR
    sudo -u $USER npm install --production
    
    echo "✓ Application setup complete"
}

# Function to setup environment file
setup_environment() {
    echo "Setting up environment file..."
    
    if [[ ! -f $APP_DIR/.env ]]; then
        echo "❌ .env file not found. Please create $APP_DIR/.env with required configuration."
        echo "Required variables:"
        echo "  BSKY_USERNAME=your-bot-username"
        echo "  BSKY_PASSWORD=your-bot-password" 
        echo "  DATABASE_FILE=hoffbot.db"
        echo "  FEED_URI=at://your-feed-uri"
        exit 1
    fi
    
    # Secure the environment file
    chown $USER:$USER $APP_DIR/.env
    chmod 600 $APP_DIR/.env
    
    echo "✓ Environment file configured"
}

# Function to setup systemd service
setup_service() {
    echo "Setting up systemd service..."
    
    # Copy service file
    cp deployment/hoffbot.service /etc/systemd/system/
    
    # Update service file paths
    sed -i "s|/opt/bsky-hoffbot|$APP_DIR|g" /etc/systemd/system/hoffbot.service
    sed -i "s|User=hoffbot|User=$USER|g" /etc/systemd/system/hoffbot.service
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    echo "✓ Systemd service configured"
}

# Function to initialize database
init_database() {
    echo "Initializing database..."
    cd $APP_DIR
    sudo -u $USER npm run db:init
    echo "✓ Database initialized"
}

# Function to start service
start_service() {
    echo "Starting Hoffbot service..."
    systemctl start $SERVICE_NAME
    
    # Wait a moment and check status
    sleep 3
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo "✓ Hoffbot service started successfully"
        echo "Status: $(systemctl is-active $SERVICE_NAME)"
    else
        echo "❌ Failed to start Hoffbot service"
        echo "Check logs with: journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

# Function to show status and useful commands
show_status() {
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "Useful commands:"
    echo "  Check status:    systemctl status $SERVICE_NAME"
    echo "  View logs:       journalctl -u $SERVICE_NAME -f"
    echo "  Restart:         systemctl restart $SERVICE_NAME"
    echo "  Stop:            systemctl stop $SERVICE_NAME"
    echo "  Health check:    curl http://localhost:3001/health"
    echo ""
    echo "Application directory: $APP_DIR"
    echo "Log files: $APP_DIR/logs/"
}

# Main deployment flow
main() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        check_root
        install_node
        create_user
        setup_app
        setup_environment
        init_database
        setup_service
        start_service
        show_status
    else
        echo "Development deployment..."
        echo "Run the following commands:"
        echo "  npm install"
        echo "  npm run db:init"
        echo "  npm run start"
    fi
}

main