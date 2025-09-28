import { connectDatabase, getDatabase } from "./db";
import { Logger } from "../utils/logger";

export const initializeDatabase = async (): Promise<void> => {
  // First ensure database connection is established
  await connectDatabase();
  
  return new Promise<void>((resolve, reject) => {
    const db = getDatabase();
    db.serialize(() => {
      // Create interactions table with improved schema
      db.run(
        `
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK(type IN ('like', 'comment')),
          postUri TEXT UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(postUri, type)
        )
      `,
        (err) => {
          if (err) {
            Logger.error('Could not create interactions table', err);
            reject(err);
          } else {
            Logger.info('interactions table created or already exists');
            
            // Create index for better performance
            db.run(
              'CREATE INDEX IF NOT EXISTS idx_interactions_postUri ON interactions(postUri)',
              (indexErr) => {
                if (indexErr) {
                  Logger.warn('Could not create index on interactions table', indexErr);
                }
                resolve();
              }
            );
          }
        },
      );
    });
  });
};

// Only run initialization if this file is executed directly
// In ES modules, we check if this file is the main module by comparing import.meta.url
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch((err) => {
    Logger.error('Database initialization failed', err);
    process.exit(1);
  });
}