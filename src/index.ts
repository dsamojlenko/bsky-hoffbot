import { CronJob } from 'cron';
import { login } from './bsky/auth';
import { dailyHoff } from './hoffbot/dailyHoff';
import { likeMentions } from './hoffbot/likeMentions';
import { Logger } from './utils/logger';
import { GracefulShutdown } from './utils/gracefulShutdown';
import { retry } from './utils/helpers';
import { HealthCheckServer } from './utils/healthCheck';
import { connectDatabase } from './database/db';

// Health monitoring
let lastHeartbeat = Date.now();
let isHealthy = true;
let healthServer: HealthCheckServer;

// Track job statuses
const jobStatus = {
  dailyHoff: { lastRun: null as Date | null, lastSuccess: null as Date | null, failures: 0 },
  likeMentions: { lastRun: null as Date | null, lastSuccess: null as Date | null, failures: 0 }
};

const updateJobStatus = (jobName: keyof typeof jobStatus, success: boolean) => {
  jobStatus[jobName].lastRun = new Date();
  if (success) {
    jobStatus[jobName].lastSuccess = new Date();
    jobStatus[jobName].failures = 0;
  } else {
    jobStatus[jobName].failures++;
  }
};

const start = async () => {
  Logger.info('Starting the hoffbot...');

  // Set up graceful shutdown
  const shutdown = GracefulShutdown.getInstance();

  // Initialize database connection
  try {
    await connectDatabase();
    Logger.info('Database connection established');
  } catch (error) {
    Logger.error('Failed to connect to database', error);
    throw error;
  }

  // Start health check server
  healthServer = new HealthCheckServer(3001);
  try {
    await healthServer.start();
  } catch (error) {
    Logger.warn('Failed to start health check server', error);
  }
  
  let bot;
  try {
    bot = await retry(
      async () => login(),
      {
        maxAttempts: 5,
        delay: 5000,
        backoff: 'exponential',
        onError: (error, attempt) => {
          Logger.warn(`Login attempt ${attempt} failed`, error);
        }
      }
    );
    Logger.info('Successfully logged in to Bluesky');
  } catch (error) {
    Logger.error('Failed to login after multiple attempts', error);
    throw error;
  }

  // This catches bot-specific mentions
  bot.on('mention', async (post) => {
    try {
      Logger.info('Mention received', {
        cid: post.cid,
        text: post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
        author: {
          did: post.author.did,
          handle: post.author.handle,
          displayName: post.author.displayName,
        }
      });

      await retry(
        async () => bot.like(post.cid),
        {
          maxAttempts: 3,
          delay: 1000,
          onError: (error, attempt) => {
            Logger.warn(`Failed to like mention on attempt ${attempt}`, error);
          }
        }
      );

      Logger.info(`Successfully liked mention from @${post.author.handle}`);
    } catch (error) {
      Logger.error('Error handling mention', error);
    }
  });

  bot.on('follow', async (follow) => {
    try {
      Logger.info('Follow received', {
        did: follow.user.did,
        handle: follow.user.handle,
        displayName: follow.user.displayName,
      });

      await retry(
        async () => follow.user.follow(),
        {
          maxAttempts: 3,
          delay: 1000,
          onError: (error, attempt) => {
            Logger.warn(`Failed to follow back on attempt ${attempt}`, error);
          }
        }
      );

      Logger.info(`Successfully followed back @${follow.user.handle}`);
    } catch (error) {
      Logger.error('Error handling follow', error);
    }
  });

  // Daily Hoff job - runs at 10 AM daily
  const dailyHoffJob = new CronJob('0 10 * * *', async () => {
    try {
      Logger.info("It's 10am, time for the daily Hoff!");
      await dailyHoff(bot);
      updateJobStatus('dailyHoff', true);
      Logger.info('Daily Hoff job completed successfully');
    } catch (error) {
      updateJobStatus('dailyHoff', false);
      Logger.error('Daily Hoff job failed', error);
    }
  });

  // Mention checking job - runs every 3 hours
  const likeMentionsJob = new CronJob('0 */3 * * *', async () => {
    try {
      Logger.info('Checking for mentions...');
      await likeMentions(bot);
      updateJobStatus('likeMentions', true);
      Logger.info('Mention checking job completed successfully');
    } catch (error) {
      updateJobStatus('likeMentions', false);
      Logger.error('Mention checking job failed', error);
    }
  });

  // Health check job - runs every 5 minutes
  const healthCheckJob = new CronJob('*/5 * * * *', () => {
    lastHeartbeat = Date.now();
    
    // Check if jobs are failing too much
    const dailyHoffHealthy = jobStatus.dailyHoff.failures < 3;
    const likeMentionsHealthy = jobStatus.likeMentions.failures < 5;
    
    isHealthy = dailyHoffHealthy && likeMentionsHealthy;
    
    // Update health server
    if (healthServer) {
      healthServer.updateHealth({
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastHeartbeat: new Date(lastHeartbeat).toISOString(),
        jobStatus
      });
    }
    
    Logger.debug('Health check', {
      isHealthy,
      lastHeartbeat: new Date(lastHeartbeat),
      jobStatus
    });

    if (!isHealthy) {
      Logger.warn('Bot health check failed', { jobStatus });
    }
  });

  // Start all cron jobs
  dailyHoffJob.start();
  likeMentionsJob.start();
  healthCheckJob.start();

  Logger.info('All cron jobs started successfully');

  // Register shutdown handlers
  shutdown.addShutdownHandler(async () => {
    Logger.info('Stopping services...');
    dailyHoffJob.stop();
    likeMentionsJob.stop();
    healthCheckJob.stop();
    
    if (healthServer) {
      await healthServer.stop();
    }
  });

  // Log startup completion
  Logger.info('Hoffbot started successfully', {
    dailyHoffSchedule: '0 10 * * * (10 AM daily)',
    likeMentionsSchedule: '0 */3 * * * (every 3 hours)',
    healthCheckSchedule: '*/5 * * * * (every 5 minutes)'
  });
};

start().catch((err) => {
  Logger.error('Failed to start hoffbot', err);
  process.exit(1);
});
