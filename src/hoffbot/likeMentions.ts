
import db from '../database/db';
import dotenv from 'dotenv';
import { Interaction, Post } from '../types';
import { Bot } from '@skyware/bot';

dotenv.config();

const FEED_URI = process.env.FEED_URI;

/**
 * Retrieve an interaction by postUri
 * @param postUri
 * @returns
 */
const getInteraction = (postUri: string): Promise<Interaction | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM interactions WHERE postUri = ?',
      [postUri],
      (err, row) => {
        if (err) {
          console.error('Could not retrieve interaction', err);
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
const insertInteraction = (interaction: Interaction) => {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO interactions (postUri, type) VALUES (?, ?)',
      [interaction.postUri, interaction.type],
      (err) => {
        if (err) {
          console.error('Could not insert interaction', err);
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
export async function likeMentions(bot: Bot) {
  if (!FEED_URI) {
    throw new Error('FEED_URI not set in .env file');
  }

  try {
    const feed = await bot.getFeedGenerator(FEED_URI);
    const posts = await feed.getPosts();

    for (const post of posts.posts) {
      const interaction = await getInteraction(post.uri);
      if (interaction) {
        continue;
      }

      try {
        await insertInteraction({
          postUri: post.uri,
          type: 'like',
        });

        console.log(`Liking post ${post.uri}`);
        post.like();

      } catch (err) {
        console.log(err);
      }
    }
  }
  catch (err) {
    console.log(err);
  }
}