import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { dailyHoff } from './hoffbot/dailyHoff';
import { likeMentions } from './hoffbot/likeMentions';

const start = async () => {
  console.log('Starting the hoffbot...');

  const bot = await login();

  // This catches bot-specific mentions
  bot.on('mention', async (post) => {
    console.log('Mention received:', {
      cid: post.cid,
      text: post.text,
      author: {
        did: post.author.did,
        handle: post.author.handle,
        displayName: post.author.displayName,
      }
    });
    await bot.like(post.cid);
  });

  bot.on('follow', async (follow) => {
    console.log('Follow received:', {
      did: follow.user.did,
      handle: follow.user.handle,
      displayName: follow.user.displayName,
    });
    await follow.user.follow();
  });

  const dailyHoffJob = new CronJob('0 10 * * *', async () => {
    console.log("It's 10am, time for the daily Hoff!");
    await dailyHoff(bot);
  });

  dailyHoffJob.start();

  // This one checks the Feed for other mentions
  const likeMentionsJob = new CronJob('0 */3 * * *', async () => {
    console.log('Checking for mentions...');
    await likeMentions(bot);
  });

  likeMentionsJob.start();
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
