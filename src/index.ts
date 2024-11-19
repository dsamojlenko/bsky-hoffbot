import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { dailyHoff } from './hoffbot/dailyHoff';

const start = async () => {
  console.log('Starting the hoffbot...');

  const bot = await login();
  bot.on('mention', async (mention) => {
    console.log('Mention received:', mention);
    await bot.like(mention.cid);
  });

  bot.on('follow', async (follower) => {
    console.log('Follow received:', follower);
    await follower.user.follow();
  });

  const dailyHoffJob = new CronJob('0 10 * * *', async () => {
    console.log("It's 10am, time for the daily Hoff!");
    await dailyHoff();
  });

  dailyHoffJob.start();
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
