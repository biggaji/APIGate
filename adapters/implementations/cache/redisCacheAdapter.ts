import { Redis } from 'ioredis';
import { CacheAdapter } from '../../interfaces/cache.js';
import { handleError } from '../../../utils/errorHandler.js';

/**
 * A cache adapter implementation using Redis.
 */
export class RedisCacheAdapter implements CacheAdapter {
  /**
   * The Redis client instance.
   */
  private readonly redisClient: Redis;

  /**
   * Constructs a new RedisCacheAdapter instance.
   *
   * @param redisClient The Redis client instance
   */
  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  /**
   * Retrieves data from the cache.
   *
   * @param key The unique key for the cached data
   * @returns A promise resolving to the cached data
   */
  async get(key: string): Promise<any> {
    try {
      return await this.redisClient.get(key);
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
  async set(
    key: string,
    value: string,
    shouldExpire: boolean = false,
    expiresInSecs: number = 0,
  ): Promise<void> {
    try {
      if (shouldExpire) {
        if (!expiresInSecs || expiresInSecs <= 0) {
          throw new Error('Expiration time must be a positive number');
        }

        await this.redisClient.set(key, value, 'EX', expiresInSecs);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      handleError(error);
    }
  }
}
