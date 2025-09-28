#!/bin/bash

# Simple monitoring script for Hoffbot
# Returns exit code 0 if healthy, 1 if unhealthy
# Usage: ./monitor.sh [--verbose] [--timeout=10]

VERBOSE=false
TIMEOUT=10
HEALTH_URL="http://localhost:3001/health"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --timeout=*)
            TIMEOUT="${1#*=}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--verbose] [--timeout=10]"
            echo "  --verbose    Show detailed output"
            echo "  --timeout=N  Set timeout in seconds (default: 10)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Function to log messages
log() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    fi
}

# Function to check if curl is available
check_curl() {
    if ! command -v curl &> /dev/null; then
        echo "ERROR: curl is required but not installed"
        exit 1
    fi
}

# Function to check if jq is available (optional)
check_jq() {
    if command -v jq &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Main health check function
check_health() {
    log "Checking health endpoint: $HEALTH_URL"
    
    # Make the health check request
    local response
    local http_code
    
    response=$(curl -s -w "%{http_code}" --max-time "$TIMEOUT" "$HEALTH_URL" 2>/dev/null)
    http_code="${response: -3}"
    response="${response%???}"
    
    # Check if curl succeeded
    if [[ $? -ne 0 ]]; then
        echo "ERROR: Failed to connect to health endpoint"
        return 1
    fi
    
    log "HTTP Status: $http_code"
    
    # Check HTTP status code
    if [[ "$http_code" != "200" ]]; then
        echo "ERROR: Health endpoint returned status $http_code"
        if [[ "$VERBOSE" == "true" && -n "$response" ]]; then
            echo "Response: $response"
        fi
        return 1
    fi
    
    # Parse JSON response if jq is available
    if check_jq && [[ -n "$response" ]]; then
        local status
        status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null)
        
        if [[ "$status" == "healthy" ]]; then
            log "Bot is healthy"
            
            if [[ "$VERBOSE" == "true" ]]; then
                echo "$response" | jq '.'
            fi
            return 0
        else
            echo "ERROR: Bot status is '$status'"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "$response" | jq '.'
            fi
            return 1
        fi
    else
        # Fallback: just check if we got a response
        if [[ -n "$response" ]]; then
            log "Health endpoint responded (jq not available for detailed parsing)"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "Raw response: $response"
            fi
            return 0
        else
            echo "ERROR: Empty response from health endpoint"
            return 1
        fi
    fi
}

# Function to check process via PID file
check_process() {
    local pid_file="./logs/hoffbot.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid
        pid=$(cat "$pid_file" 2>/dev/null)
        
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            log "Process $pid is running"
            return 0
        else
            log "PID file exists but process $pid is not running"
            return 1
        fi
    else
        log "No PID file found at $pid_file"
        return 1
    fi
}

# Function to check systemd service
check_systemd() {
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet hoffbot 2>/dev/null; then
            log "Systemd service is active"
            return 0
        else
            log "Systemd service is not active"
            return 1
        fi
    else
        log "Systemctl not available, skipping systemd check"
        return 1
    fi
}

# Main execution
main() {
    log "Starting Hoffbot health check"
    
    check_curl
    
    # Try health endpoint first (most reliable)
    if check_health; then
        echo "✅ Hoffbot is healthy"
        exit 0
    fi
    
    log "Health endpoint failed, trying alternative checks..."
    
    # Fallback to process check
    if check_process; then
        echo "⚠️  Hoffbot process is running but health endpoint failed"
        exit 1
    fi
    
    # Fallback to systemd check
    if check_systemd; then
        echo "⚠️  Hoffbot systemd service is active but health endpoint failed"
        exit 1
    fi
    
    echo "❌ Hoffbot appears to be down"
    exit 1
}

# Run the main function
main "$@"