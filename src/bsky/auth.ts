import { BskyAgent } from '@atproto/api';
import * as process from 'process';
import * as dotenv from 'dotenv';

dotenv.config();

export const agent = new BskyAgent({
  service: 'https://bsky.social',
});

export const login = async () => {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
};
