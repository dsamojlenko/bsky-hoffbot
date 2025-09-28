import { Bot } from '@skyware/bot';
import * as process from 'process';
import * as dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

if (!process.env.BSKY_USERNAME || !process.env.BSKY_PASSWORD) {
  throw new Error('BSKY_USERNAME and BSKY_PASSWORD must be set');
}

export const bot = new Bot({
  eventEmitterOptions: {
    pollingInterval: 1000, // Increased from 100ms to reduce API load
  },
});

export const login = async (): Promise<Bot> => {
  await bot.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!,
  });

  return bot;
};
