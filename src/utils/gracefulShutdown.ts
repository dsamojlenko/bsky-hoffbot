/**
 * Graceful shutdown handler
 */
export class GracefulShutdown {
  private static instance: GracefulShutdown;
  private shutdownHandlers: Array<() => Promise<void> | void> = [];
  private isShuttingDown = false;

  private constructor() {
    // Handle various shutdown signals
    process.on('SIGTERM', this.handleShutdown.bind(this));
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGQUIT', this.handleShutdown.bind(this));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.handleShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleShutdown();
    });
  }

  public static getInstance(): GracefulShutdown {
    if (!GracefulShutdown.instance) {
      GracefulShutdown.instance = new GracefulShutdown();
    }
    return GracefulShutdown.instance;
  }

  public addShutdownHandler(handler: () => Promise<void> | void): void {
    this.shutdownHandlers.push(handler);
  }

  private async handleShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Gracefully shutting down...');

    try {
      // Execute all shutdown handlers
      await Promise.allSettled(
        this.shutdownHandlers.map(handler => 
          Promise.resolve(handler())
        )
      );
      
      console.log('Shutdown completed successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }
}