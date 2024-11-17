import { login, agent } from '../bsky/auth';
import db from '../database/db';
import { FeedPost } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const FEED_URI = process.env.FEED_URI;

/**
 * Save a post to the database
 * @param post
 * @returns
 */
function insertPost(post: {
  uri: string;
  text: string;
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string;
}) {
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
function insertInteraction(interaction: { postUri: string; type: string }) {
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

  await login();
  const feed = await agent.api.app.bsky.feed.getFeed({
    feed: FEED_URI,
  });

  for (const item of feed.data.feed) {
    const post = item.post as FeedPost;
    try {
      await insertPost({
        uri: post.uri,
        text: post.record.text,
        authorDid: post.author.did,
        authorHandle: post.author.handle,
        authorDisplayName: post.author.displayName,
      });

      console.log('Liking post', post.uri);

      // Like the post
      await agent.like(post.uri, post.cid);

      await insertInteraction({
        postUri: post.uri,
        type: 'like',
      });
    } catch (err) {
      console.log(err);
    }
  }
}
