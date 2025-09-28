/**
 * Simple HTTP health check server
 * Provides endpoints to monitor bot health and status
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Logger } from './logger';
import fs from 'fs';
import path from 'path';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  lastHeartbeat?: string;
  jobStatus?: any;
  memoryUsage: NodeJS.MemoryUsage;
  checks: {
    database: boolean;
    files: boolean;
    diskSpace: boolean;
  };
}

export class HealthCheckServer {
  private server?: any;
  private port: number;
  private healthData: Partial<HealthStatus> = {};

  constructor(port = 3001) {
    this.port = port;
  }

  public updateHealth(data: Partial<HealthStatus>): void {
    this.healthData = { ...this.healthData, ...data };
  }

  private async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      files: await this.checkFiles(),
      diskSpace: await this.checkDiskSpace()
    };

    const allHealthy = Object.values(checks).every(check => check);
    const status = allHealthy ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      memoryUsage: process.memoryUsage(),
      checks,
      ...this.healthData
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const dbFile = process.env.DATABASE_FILE;
      if (!dbFile) return false;
      
      return fs.existsSync(dbFile);
    } catch {
      return false;
    }
  }

  private async checkFiles(): Promise<boolean> {
    try {
      const quotesPath = path.resolve('./resources/quotes.txt');
      const imagesPath = path.resolve('./resources/hoffpics');
      
      return fs.existsSync(quotesPath) && fs.existsSync(imagesPath);
    } catch {
      return false;
    }
  }

  private async checkDiskSpace(): Promise<boolean> {
    try {
      // Simple check - ensure we can write to logs directory
      const testFile = path.resolve('./logs/.health-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = req.url || '/';
    const method = req.method || 'GET';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (url) {
        case '/health':
        case '/':
          const health = await this.getHealthStatus();
          const statusCode = health.status === 'healthy' ? 200 : 503;
          
          res.writeHead(statusCode, {
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify(health, null, 2));
          break;

        case '/ping':
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('pong');
          break;

        case '/metrics':
          const metrics = {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(metrics, null, 2));
          break;

        default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
      }
    } catch (error) {
      Logger.error('Health check server error', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  };

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.handleRequest);
      
      this.server.on('error', (error: Error) => {
        Logger.error('Health check server error', error);
        reject(error);
      });

      this.server.listen(this.port, () => {
        Logger.info(`Health check server started on port ${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          Logger.info('Health check server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}