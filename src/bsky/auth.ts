import { Bot } from '@skyware/bot';
import * as process from 'process';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.BSKY_USERNAME || !process.env.BSKY_PASSWORD) {
  throw new Error('BSKY_USERNAME and BSKY_PASSWORD must be set');
}

export const bot = new Bot({
  eventEmitterOptions: {
    pollingInterval: 100,
  },
});

export const login = async () => {
  await bot.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!,
  });

  return bot;
};
