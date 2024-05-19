import { Redis } from 'ioredis';
import { RedisCacheAdapter } from '../implementations/cache/redisCacheAdapter.js';
import Memcached from 'memcached';
import { MemCacheAdapter } from '../implementations/cache/memCacheAdapter.js';

/**
 * Factory class for creating cache adapters.
 *
 * This class provides a static method to create cache adapters based on the provided cache client.
 */
export class CacheFactory {
  /**
   * Creates a cache adapter instance based on the provided cache client.
   *
   * @param cacheClient The cache client instance (Redis or Memcached)
   * @returns A cache adapter instance (RedisCacheAdapter or MemCacheAdapter)
   * @throws {Error} If the provided cache client is not supported
   */
  static useClient(cacheClient: Redis | Memcached) {
    if (cacheClient instanceof Redis) {
      return new RedisCacheAdapter(cacheClient);
    } else if (cacheClient instanceof Memcached) {
      return new MemCacheAdapter(cacheClient);
    } else {
      throw new Error(`Unsupported cache client: ${cacheClient}`);
    }
  }
}
