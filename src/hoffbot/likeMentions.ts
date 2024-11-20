
import { db } from '../database/db';
import dotenv from 'dotenv';
import { Interaction, Post } from '../types';
import { login } from '../bsky/auth';

dotenv.config();

const FEED_URI = process.env.FEED_URI;

/**
 * Save a post to the database
 * @param post
 * @returns
 */
const insertPost = (post: Post) => {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO posts (uri, text, authorDid, authorHandle, authorDisplayName) VALUES (?, ?, ?, ?, ?)',
      [
        post.uri,
        post.text,
        post.authorDid,
        post.authorHandle,
        post.authorDisplayName,
      ],
      (err) => {
        if (err) {
          if ((err as any).code === 'SQLITE_CONSTRAINT') {
            reject(`Already interacted with ${post.uri}`);
          } else {
            console.error('Could not insert post', err);
            reject(err);
          }
        } else {
          console.log('New mention found', post.uri);
          resolve();
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
export async function likeMentions() {
  if (!FEED_URI) {
    throw new Error('FEED_URI not set in .env file');
  }

  const bot = await login();
  const feed = await bot.getFeedGenerator(FEED_URI);
  const posts = await feed.getPosts();


  // const feed = await agent.api.app.bsky.feed.getFeed({
  //   feed: FEED_URI,
  // });

  for (const post of posts.posts) {

    try {
      await insertPost({
        uri: post.uri,
        text: post.text,
        authorDid: post.author.did,
        authorHandle: post.author.handle,
        authorDisplayName: post.author.displayName || "",
      });

      console.log('Liking post', post.uri);

      // Like the post
      await bot.like(post.cid);

      await insertInteraction({
        postUri: post.uri,
        type: 'like',
      });
    } catch (err) {
      console.log(err);
    }
  }
}