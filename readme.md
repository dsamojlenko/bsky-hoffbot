# Hoffbot - Your Daily Hoff 🤖🏄‍♂️

A robust Bluesky bot that posts daily David Hasselhoff content with improved stability, monitoring, and error handling. This code can be repurposed for any daily-posting image/text bot.

## Features

- **Daily Posts**: Automatically posts a Hoff quote and image at 10 AM daily
- **Mention Monitoring**: Likes posts that mention "David Hasselhoff", "The Hoff", or "Hasselhoff"
- **Auto Follow-back**: Automatically follows users who follow the bot
- **Mention Responses**: Likes posts that mention the bot directly
- **Enhanced Stability**: Comprehensive error handling and retry mechanisms
- **Health Monitoring**: Built-in health check endpoint for monitoring
- **Process Monitoring**: Automatic restart on crashes
- **Rate Limiting**: Prevents API abuse and rate limit violations
- **Graceful Shutdown**: Proper cleanup on termination signals

## 🆕 Stability Improvements (v2.0)

- **Retry Logic**: Automatic retries with exponential backoff for failed API calls
- **Error Recovery**: Comprehensive error handling that prevents crashes
- **Rate Limiting**: Built-in rate limiting to avoid API limits
- **Health Monitoring**: HTTP health check endpoint at `http://localhost:3001/health`
- **Process Monitoring**: Automatic restart on crashes with exponential backoff
- **Enhanced Logging**: Structured logging with different levels and timestamps
- **Database Improvements**: Better error handling and connection management
- **Graceful Shutdown**: Proper cleanup of resources on termination

## Requirements

- Node.js 18+
- SQLite3
- Bluesky account for the bot

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd bsky-hoffbot
npm install
```

### 2. Configuration
```bash
cp .env.example .env
```

Configure the following environment variables in `.env`:
- `BSKY_USERNAME` - The username of the bot account (e.g., hoffbot.bsky.social)
- `BSKY_PASSWORD` - The password of the bot account
- `DATABASE_FILE` - Name of the database file (e.g., hoffbot.db)
- `FEED_URI` - The URI of the custom feed that aggregates Hoff mentions
- `HOFFBOT_DID` - The DID of the Hoffbot account (optional)

### 3. Add Content
- Add Hoff images to `resources/hoffpics/`
- Add quotes to `resources/quotes.txt` (one quote per line)

### 4. Initialize Database
```bash
npm run db:init
```

### 5. Run the Bot

**Development:**
```bash
npm run start
```

**Production with process monitoring:**
```bash
npm run start:monitor
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the bot normally |
| `npm run start:monitor` | Start with process monitoring (recommended for production) |
| `npm run db:init` | Initialize the database |
| `npm run health` | Check bot health status |
| `npm run hoffbot:daily-hoff` | Run daily Hoff post manually |
| `npm run hoffbot:like-mentions` | Run mention checking manually |
| `npm run logs:clean` | Clean old log files (30+ days) |
| `npm run check:types` | Check TypeScript types |
| `npm run format` | Format code with Prettier |

## Monitoring & Health Checks

### Health Check Endpoint
The bot exposes a health check server on port 3001:

- `GET /health` - Comprehensive health status
- `GET /ping` - Simple ping/pong check
- `GET /metrics` - System metrics (memory, uptime, etc.)

Example health check:
```bash
curl http://localhost:3001/health | jq
```

## Production Deployment

### Systemd Service (Linux)
```bash
# Copy the service file
sudo cp deployment/hoffbot.service /etc/systemd/system/

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable hoffbot
sudo systemctl start hoffbot

# Check status
sudo systemctl status hoffbot
```

### Automated Deployment
Use the provided deployment script:
```bash
chmod +x deployment/deploy.sh
sudo ./deployment/deploy.sh production
```

## Schedule

- **Daily Hoff Post**: Every day at 10:00 AM
- **Mention Checking**: Every 3 hours
- **Health Checks**: Every 5 minutes
- **Log Rotation**: Automatic on restart

## Troubleshooting

### Common Issues

1. **Bot not starting**: Check environment variables and network connectivity
2. **Database errors**: Ensure write permissions to database file location
3. **Image/quote errors**: Verify files exist in `resources/` directory
4. **API rate limits**: Bot includes built-in rate limiting, but check Bluesky status

### Debug Mode
Set `NODE_ENV=development` for detailed debug logs.

### View Logs
```bash
# Real-time logs
tail -f logs/hoffbot.log

# Service logs (systemd)
journalctl -u hoffbot -f

# Health status
npm run health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper error handling
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
