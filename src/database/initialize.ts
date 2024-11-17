import db from './db';

export const initializeDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Create posts table with flattened author data
      db.run(
        `
        CREATE TABLE IF NOT EXISTS posts (
          uri TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          authorDid TEXT NOT NULL,
          authorHandle TEXT NOT NULL,
          authorDisplayName TEXT NOT NULL
        )
      `,
        (err) => {
          if (err) {
            console.error('Could not create posts table', err);
            reject(err);
          } else {
            console.log('posts table created or already exists');
          }
        },
      );

      // Create interactions table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK(type IN ('like', 'comment')),
          postUri TEXT NOT NULL,
          FOREIGN KEY (postUri) REFERENCES posts(uri)
        )
      `,
        (err) => {
          if (err) {
            console.error('Could not create interactions table', err);
            reject(err);
          } else {
            console.log('interactions table created or already exists');
            resolve();
          }
        },
      );
    });
  });
};
