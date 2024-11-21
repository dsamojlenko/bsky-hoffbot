
import db from '../database/db';
import dotenv from 'dotenv';
import { Interaction, Post } from '../types';
import { login } from '../bsky/auth';

dotenv.config();

const FEED_URI = process.env.FEED_URI;



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
          if ((err as any).code === 'SQLITE_CONSTRAINT') {
            reject(`Already interacted with ${interaction.postUri}`);
          } else {
            console.error('Could not insert interaction', err);
            reject(err);
          }
        } else {
          console.log('New interaction', interaction);
          resolve();
        }
      },
    );
  });
}

/**
 * Like any post that mentions The Hoff
 */
export async function likeMentions() {
  if (!FEED_URI) {
    throw new Error('FEED_URI not set in .env file');
  }

  login().then(async (bot) => {
    const feed = await bot.getFeedGenerator(FEED_URI);
    const posts = await feed.getPosts();

    for (const post of posts.posts) {
      try {
        await insertInteraction({
          postUri: post.uri,
          type: 'like',
        });

        console.log("liking the post");
        // Like the post
        post.like();

      } catch (err) {
        // console.log(err);
      }
    }
  }).catch((err) => {
    console.log(err);
  }).finally(() => {
    console.log("done liking mentions")
  })
}