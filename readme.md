# Hoffbot- Your Daily Hoff
This is the source for the Bluesky Hoffbot, but this code could be re-purposed for any daily-posting image/text bot.

The dailyHoff bot runs on a cron job that will post an image and quote at 10am daily.

The likeMentions bot runs on a separate cron job that monitors a custom Feed that aggregates all posts that mention "David Hasselhoff" "The Hoff" or "Hasselhoff" and likes the post.

There is also a bot that "listens" for anyone that follows the bot account and follows back.
And there is a bot that "listens" for any bot-specific mentions and likes the post.

## Setup

```
cp .env.example .env
```

Configure environment variables:

- `BSKY_USERNAME` The username of the bot account
- `BSKY_PASSWORD` The password of the bot account
- `DATABASE_FILE` Name of the database file to store interactions
- `FEED_URI` The URI of the Feed that collects mentions
- `HOFFBOT_DID` The DID of the Hoffbot account


Add images to `resources/hoffpics`
Add quotes to `quotes.txt` one quote per line

## Initialize the database

```
npm run db:init
```

## Run the Hoffbot

```
npm install
npm run start
```

