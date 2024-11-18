import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { likeMentions } from './hoffbot/likeMentions';
import { followBack } from './hoffbot/followBack';
import { dailyHoff } from './hoffbot/dailyHoff';

login()
  .then(() => {
    console.log('Starting the hoffbot...');
    const scheduleExpression = '*/5 * * * *';
    const likeMentionsJob = new CronJob(scheduleExpression, async () => {
      console.log('Running likeMentionsJob');
      await likeMentions();
    });
    const followBackJob = new CronJob(scheduleExpression, async () => {
      console.log('Running followBackJob');
      await followBack();
    });
    const dailyHoffJob = new CronJob('0 10 * * *', async () => {
      console.log('Running dailyHoffJob');
      await dailyHoff();
    });

    // Start the cron jobs
    likeMentionsJob.start();
    followBackJob.start();
    dailyHoffJob.start();
  })
  .catch((err) => {
    console.error('Error during setup', err);
  });
