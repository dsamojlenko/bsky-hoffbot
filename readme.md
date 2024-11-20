# Hoffbot- Your Daily Hoff
This is the source for the Bluesky Hoffbot, but this code could be re-purposed for any daily-posting image/text bot.

By default, the bot runs on a cron job that will post an image and quote at 10am daily.

It also "listens" for any follows and follows back.

It also "listens" for any mentions and likes the post.

## Setup

```
cp .env.example .env
```

Configure environment variables:

```
BSKY_USERNAME=
BSKY_PASSWORD=
HOFFBOT_DID=
```

Add images to `resources/hoffpics`
Add quotes to `quotes.txt` one quote per line

## Run the Hoffbot

```
npm install
npm run start
```

