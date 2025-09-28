import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';
import { GracefulShutdown } from '../utils/gracefulShutdown';

dotenv.config();

const dbFile = process.env.DATABASE_FILE || 'hoffbot.db';

if (!dbFile) {
  throw new Error('DATABASE_FILE not set in .env file');
}

class Database {
  private db: sqlite3.Database | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize immediately - wait for connect() to be called
  }

  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbFile!, (err) => {
        if (err) {
          Logger.error('Could not connect to database', err);
          reject(err);
        } else {
          Logger.info(`Connected to database: ${dbFile}`);
          this.isConnected = true;
          
          // Enable foreign keys and set other pragmas for better performance
          this.db!.serialize(() => {
            this.db!.run('PRAGMA foreign_keys = ON');
            this.db!.run('PRAGMA journal_mode = WAL');
            this.db!.run('PRAGMA synchronous = NORMAL');
          });
          
          resolve();
        }
      });
    });

    // Register cleanup on shutdown
    const shutdown = GracefulShutdown.getInstance();
    shutdown.addShutdownHandler(async () => {
      await this.close();
    });

    return this.connectionPromise;
  }

  public getDatabase(): sqlite3.Database {
    if (!this.isConnected || !this.db) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (!this.isConnected || !this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          Logger.error('Error closing database', err);
          reject(err);
        } else {
          Logger.info('Database connection closed');
          this.isConnected = false;
          this.db = null;
          resolve();
        }
      });
    });
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }
}

const database = new Database();

// Export a function to get the database instance
export const connectDatabase = () => database.connect();
export const getDatabase = () => database.getDatabase();
export const closeDatabase = () => database.close();

export default database;