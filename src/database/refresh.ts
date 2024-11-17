import db from './db';
import { seedDatabase } from './seed';
import { initializeDatabase } from './initialize';

export const refreshDatabase = async () => {
  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS posts`, (err) => {
        if (err) {
          console.error('Could not drop posts table', err);
          reject(err);
        } else {
          console.log('posts table dropped');
        }
      });

      db.run(`DROP TABLE IF EXISTS feeds`, (err) => {
        if (err) {
          console.error('Could not drop feeds table', err);
          reject(err);
        } else {
          console.log('feeds table dropped');
        }
      });

      db.run(`VACUUM`, async (err) => {
        if (err) {
          console.error('Could not vacuum database', err);
          reject(err);
        } else {
          try {
            await initializeDatabase();
            await seedDatabase();
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  });
};
