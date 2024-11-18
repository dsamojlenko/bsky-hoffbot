import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { likeMentions } from './hoffbot/likeMentions';
import { followBack } from './hoffbot/followBack';

login()
  .then(() => {
    console.log('Starting the hoffbot...');
    const scheduleExpression = '*/5 * * * *';
    const likeMentionsJob = new CronJob(scheduleExpression, async () => {
      await likeMentions();
    });
    const followBackJob = new CronJob(scheduleExpression, async () => {
      await followBack();
    });

    // Start the cron jobs
    likeMentionsJob.start();
  })
  .catch((err) => {
    console.error('Error during setup', err);
  });
