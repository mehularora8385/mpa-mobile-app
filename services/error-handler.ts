/**
 * Error Handling and Retry Logic Service
 * Handles network errors, timeouts, and automatic retries
 */

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface ErrorContext {
  error: Error;
  retryCount: number;
  totalAttempts: number;
  lastError?: Error;
}

type ErrorHandler = (context: ErrorContext) => void;
type RetryPredicate = (error: Error) => boolean;

class ErrorHandlerService {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  private errorHandlers: Map<string, ErrorHandler> = new Map();
  private retryPredicates: RetryPredicate[] = [];

  constructor() {
    this.setupDefaultRetryPredicates();
  }

  /**
   * Setup default retry predicates
   */
  private setupDefaultRetryPredicates(): void {
    // Retry on network errors
    this.addRetryPredicate((error) => {
      return error.message.includes('Network') ||
             error.message.includes('ECONNREFUSED') ||
             error.message.includes('ETIMEDOUT') ||
             error.message.includes('ENOTFOUND');
    });

    // Retry on timeout errors
    this.addRetryPredicate((error) => {
      return error.message.includes('timeout') ||
             error.message.includes('TIMEOUT');
    });

    // Retry on 5xx server errors
    this.addRetryPredicate((error) => {
      const match = error.message.match(/status (\d+)/);
      if (match) {
        const status = parseInt(match[1]);
        return status >= 500 && status < 600;
      }
      return false;
    });

    // Retry on 429 (Too Many Requests)
    this.addRetryPredicate((error) => {
      return error.message.includes('429');
    });
  }

  /**
   * Add retry predicate
   */
  addRetryPredicate(predicate: RetryPredicate): void {
    this.retryPredicates.push(predicate);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    return this.retryPredicates.some(predicate => {
      try {
        return predicate(error);
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}${context ? ` - ${context}` : ''}`);
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const errorContext: ErrorContext = {
          error: lastError,
          retryCount: attempt,
          totalAttempts: this.retryConfig.maxRetries + 1,
          lastError: lastError,
        };

        // Call error handler if registered
        if (context) {
          const handler = this.errorHandlers.get(context);
          if (handler) {
            handler(errorContext);
          }
        }

        // Check if we should retry
        if (attempt < this.retryConfig.maxRetries && this.isRetryable(lastError)) {
          console.warn(`⚠️ Retryable error on attempt ${attempt + 1}: ${lastError.message}`);
          console.log(`⏳ Waiting ${delay}ms before retry...`);

          await this.delay(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
        } else {
          // Don't retry
          console.error(`❌ Non-retryable error or max retries reached: ${lastError.message}`);
          throw lastError;
        }
      }
    }

    // Should not reach here, but just in case
    throw lastError || new Error('Unknown error');
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeoutMs}ms${context ? ` - ${context}` : ''}`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Execute function with retry and timeout
   */
  async executeWithRetryAndTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    context?: string
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.executeWithTimeout(fn, timeoutMs, context),
      context
    );
  }

  /**
   * Register error handler
   */
  registerErrorHandler(context: string, handler: ErrorHandler): void {
    this.errorHandlers.set(context, handler);
  }

  /**
   * Remove error handler
   */
  removeErrorHandler(context: string): void {
    this.errorHandlers.delete(context);
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
    console.log('✅ Retry configuration updated:', this.retryConfig);
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error message
   */
  formatErrorMessage(error: Error): string {
    if (error.message.includes('Network')) {
      return '🌐 Network error - Please check your internet connection';
    }
    if (error.message.includes('timeout')) {
      return '⏱️ Request timeout - Server is taking too long to respond';
    }
    if (error.message.includes('401')) {
      return '🔐 Unauthorized - Please login again';
    }
    if (error.message.includes('403')) {
      return '🚫 Forbidden - You do not have permission';
    }
    if (error.message.includes('404')) {
      return '❌ Not found - Resource does not exist';
    }
    if (error.message.includes('500')) {
      return '⚠️ Server error - Please try again later';
    }
    return `❌ Error: ${error.message}`;
  }

  /**
   * Log error with context
   */
  logError(error: Error, context: string): void {
    console.error(`❌ [${context}] ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }

  /**
   * Create error with retry info
   */
  createErrorWithRetryInfo(error: Error, retryCount: number, maxRetries: number): Error {
    const message = `${error.message} (Attempt ${retryCount + 1}/${maxRetries + 1})`;
    const newError = new Error(message);
    newError.stack = error.stack;
    return newError;
  }
}

export default new ErrorHandlerService();
