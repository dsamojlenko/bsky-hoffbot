import db from "./db";


export const initializeDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Create interactions table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS interactions (
          type TEXT NOT NULL CHECK(type IN ('like', 'comment')),
          postUri TEXT PRIMARY KEY
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

initializeDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});