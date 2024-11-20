import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbFile = process.env.DATABASE_FILE;

if (!dbFile) {
  throw new Error('DATABASE_FILE not set in .env file');
}

export const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
  }
});
