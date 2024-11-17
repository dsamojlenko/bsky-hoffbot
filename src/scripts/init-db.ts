import { initializeDatabase } from '../database/initialize';

initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error initializing database', err);
    process.exit(1);
  });
