import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { likeMentions } from './hoffbot/likeMentions';

login()
  .then(() => {
    console.log('Starting the hoffbot...');
    const scheduleExpression = '*/10 * * * *';
    const likeMentionsJob = new CronJob(scheduleExpression, async () => {
      await likeMentions();
    });

    // Start the cron jobs
    likeMentionsJob.start();
  })
  .catch((err) => {
    console.error('Error during setup', err);
  });
