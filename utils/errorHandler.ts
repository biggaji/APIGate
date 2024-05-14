import { logger } from './logger.js';

export function handleError(error: any): void {
  console.error('An error occurred:', error.message);

  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  // add a logger error message
  logger.error('Error occurred', error);

  // re-throw the original error
  throw error;
}
