import Memcached from 'memcached';
import { CacheAdapter } from '../../interfaces/cache.js';
import { handleError } from '../../../utils/errorHandler.js';

/**
 * A cache adapter implementation using Memcached.
 */
export class MemCacheAdapter implements CacheAdapter {
  /**
   * The Memcached client instance.
   */
  private readonly memClient: Memcached;

  /**
   * Constructs a new MemCacheAdapter instance.
   *
   * @param memClient The Memcached client instance
   */
  constructor(memClient: Memcached) {
    this.memClient = memClient;
  }

  /**
   * Retrieves data from the cache.
   *
   * @param key The unique key for the cached data
   * @returns A promise resolving to the cached data
   */
  async get(key: string): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        this.memClient.get(key, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      handleError(error);
    }
  }

  /**
   * Stores data in the cache.
   *
   * @param key The unique key for the cached data
   * @param value The data to be stored
   * @param shouldExpire A boolean indicating if the cached data should be deleted after the provided ttl
   * @param ttl Expiry time in seconds (only applicable if shouldExpire is true)
   * @returns A promise resolving when the data is stored
   */
  async set(key: string, value: string, shouldExpire: boolean = false, ttl: number = 0): Promise<void> {
    try {
      if (shouldExpire) {
        if (!ttl || ttl <= 0) {
          throw new Error('Expiration time must be a positive number');
        }

        return new Promise((resolve, reject) => {
          this.memClient.set(key, value, ttl, (err) => {
            if (err) {
              reject(err);
            }
          });
        });
      } else {
        return new Promise((resolve, reject) => {
          // No expiration of the data
          this.memClient.set(key, value, 0, (err) => {
            if (err) {
              reject(err);
            }
          });
        });
      }
    } catch (error) {
      handleError(error);
    }
  }
}
