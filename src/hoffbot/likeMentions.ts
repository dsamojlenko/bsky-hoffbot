
import { getDatabase } from '../database/db';
import dotenv from 'dotenv';
import { Interaction, Post } from '../types';
import { Bot } from '@skyware/bot';
import { Logger } from '../utils/logger';
import { retry, RateLimiter } from '../utils/helpers';

dotenv.config();

const FEED_URI = process.env.FEED_URI;

// Rate limiter: max 30 likes per minute to avoid hitting limits
const likeLimiter = new RateLimiter(30, 60 * 1000);

/**
 * Retrieve an interaction by postUri
 * @param postUri
 * @returns
 */
const getInteraction = (postUri: string): Promise<Interaction | null> => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(
      'SELECT * FROM interactions WHERE postUri = ?',
      [postUri],
      (err, row) => {
        if (err) {
          Logger.error('Could not retrieve interaction', err);
          reject(err);
        } else {
          resolve(row ? (row as Interaction) : null);
        }
      },
    );
  });
}

/**
 * Record an interaction with a post
 * @param interaction
 * @returns
 */
const insertInteraction = (interaction: Interaction): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const db = getDatabase();
    db.run(
      'INSERT OR IGNORE INTO interactions (postUri, type) VALUES (?, ?)',
      [interaction.postUri, interaction.type],
      (err: Error | null) => {
        if (err) {
          Logger.error('Could not insert interaction', err);
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
}

/**
 * Like any post that mentions The Hoff
 */
export async function likeMentions(bot: Bot): Promise<void> {
  if (!FEED_URI) {
    throw new Error('FEED_URI not set in .env file');
  }

  try {
    Logger.info('Starting mention check...');

    const feed = await retry(
      async () => bot.getFeedGenerator(FEED_URI),
      {
        maxAttempts: 3,
        delay: 1000,
        onError: (error, attempt) => {
          Logger.warn(`Failed to get feed generator on attempt ${attempt}`, error);
        }
      }
    );

    const posts = await retry(
      async () => feed.getPosts(),
      {
        maxAttempts: 3,
        delay: 1000,
        onError: (error, attempt) => {
          Logger.warn(`Failed to get posts on attempt ${attempt}`, error);
        }
      }
    );

    Logger.info(`Found ${posts.posts.length} posts to check`);

    let likedCount = 0;
    let skippedCount = 0;

    for (const post of posts.posts) {
      try {
        // Check if we already interacted with this post
        const interaction = await getInteraction(post.uri);
        if (interaction) {
          skippedCount++;
          continue;
        }

        // Record the interaction first to prevent double-processing
        await insertInteraction({
          postUri: post.uri,
          type: 'like',
        });

        // Rate limit our likes
        await likeLimiter.throttle();

        // Like the post with retry logic
        await retry(
          async () => {
            await post.like();
          },
          {
            maxAttempts: 2,
            delay: 500,
            onError: (error, attempt) => {
              Logger.warn(`Failed to like post ${post.uri} on attempt ${attempt}`, error);
            }
          }
        );

        likedCount++;
        Logger.info(`Liked post ${post.uri} by @${post.author.handle}`);

      } catch (err) {
        Logger.error(`Error processing post ${post.uri}`, err);
        // Continue with other posts even if one fails
      }
    }

    Logger.info(`Mention check completed: ${likedCount} liked, ${skippedCount} skipped`);
  } catch (err) {
    Logger.error('Error in likeMentions function', err);
    throw err;
  }
}