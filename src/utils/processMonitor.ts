#!/usr/bin/env node

/**
 * Process monitor for the Hoffbot
 * Ensures the bot stays running and restarts it if it crashes
 */

import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

class ProcessMonitor {
  private process: ChildProcess | null = null;
  private restartCount = 0;
  private maxRestarts = 10;
  private restartDelay = 5000; // 5 seconds
  private isShuttingDown = false;
  private pidFile = path.resolve('./logs/hoffbot.pid');
  private startTime = Date.now();

  constructor() {
    // Handle shutdown signals
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  private writePidFile(pid: number): void {
    try {
      fs.writeFileSync(this.pidFile, pid.toString());
      Logger.info(`PID file written: ${this.pidFile}`);
    } catch (error) {
      Logger.error('Failed to write PID file', error);
    }
  }

  private removePidFile(): void {
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
        Logger.info('PID file removed');
      }
    } catch (error) {
      Logger.error('Failed to remove PID file', error);
    }
  }

  private startBot(): void {
    if (this.isShuttingDown) {
      return;
    }

    Logger.info(`Starting hoffbot... (attempt ${this.restartCount + 1})`);

    this.process = spawn('npm', ['run', 'start'], {
      stdio: ['inherit', 'inherit', 'inherit'],
      detached: false,
      cwd: process.cwd()
    });

    if (this.process.pid) {
      this.writePidFile(this.process.pid);
    }

    this.process.on('exit', (code, signal) => {
      Logger.warn(`Hoffbot process exited`, { code, signal, restartCount: this.restartCount });
      
      if (this.isShuttingDown) {
        Logger.info('Process monitor is shutting down, not restarting bot');
        return;
      }

      if (this.restartCount >= this.maxRestarts) {
        Logger.error(`Maximum restart attempts (${this.maxRestarts}) reached. Giving up.`);
        process.exit(1);
      }

      // Exponential backoff for restart delay
      const delay = this.restartDelay * Math.pow(2, Math.min(this.restartCount, 5));
      Logger.info(`Restarting hoffbot in ${delay}ms...`);
      
      setTimeout(() => {
        this.restartCount++;
        this.startBot();
      }, delay);
    });

    this.process.on('error', (error) => {
      Logger.error('Failed to start hoffbot process', error);
    });

    // Reset restart count on successful run (after 1 hour)
    setTimeout(() => {
      if (!this.isShuttingDown && this.process) {
        this.restartCount = 0;
        Logger.info('Reset restart count after successful run');
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    Logger.info('Process monitor shutting down...');

    if (this.process) {
      Logger.info('Stopping hoffbot process...');
      
      // Try graceful shutdown first
      this.process.kill('SIGTERM');
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          Logger.warn('Force killing hoffbot process');
          this.process.kill('SIGKILL');
        }
      }, 10000);
    }

    this.removePidFile();
    
    // Exit after a short delay to allow cleanup
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }

  public start(): void {
    Logger.info('Starting process monitor for hoffbot');
    
    // Log system information
    Logger.info('System info', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      maxRestarts: this.maxRestarts,
      restartDelay: this.restartDelay
    });

    this.startBot();
  }

  public getStatus(): object {
    return {
      isRunning: this.process !== null && !this.process.killed,
      pid: this.process?.pid,
      restartCount: this.restartCount,
      uptime: Date.now() - this.startTime,
      maxRestarts: this.maxRestarts
    };
  }
}

export default ProcessMonitor;

// Start the monitor if this file is executed directly
// In ES modules, we check if this file is the main module by comparing import.meta.url
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ProcessMonitor();
  monitor.start();
}