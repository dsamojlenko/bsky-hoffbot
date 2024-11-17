import { CronJob } from 'cron';
import { fetchPosts } from './fetchPosts';
import { postNewPosts } from './postNewPosts';
import { login, agent } from './bsky/auth';

login()
  .then(() => {
    // Run fetchPosts on a cron job
    const fetchScheduleExpression = '*/10 * * * *';
    const fetchJob = new CronJob(fetchScheduleExpression, async () => {
      console.log('Fetching posts...');
      await fetchPosts();
      console.log('Finished fetching posts');
    });

    // Run postNewPosts on a separate cron job
    const postScheduleExpression = '*/10 * * * *';
    const postJob = new CronJob(postScheduleExpression, async () => {
      console.log('Posting new posts...');
      await postNewPosts(agent);
      console.log('Finished posting new posts');
    });

    // Start the cron jobs
    fetchJob.start();
    postJob.start();
  })
  .catch((err) => {
    console.error('Error during setup', err);
  });
