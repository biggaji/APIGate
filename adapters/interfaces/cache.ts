/**
 * Interface for cache adapters.
 *
 * This interface defines the contract for cache adapters, which are responsible for storing and retrieving data from a cache.
 */
export interface CacheAdapter {
  /**
   * Retrieves data from the cache.
   *
   * @param key The unique key for the cached data
   * @returns A promise resolving to the cached data, or null if the key is not found
   */
  get(key: string): Promise<any>;

  /**
   * Stores data in the cache.
   *
   * @param key The unique key for the cached data
   * @param value The data to be stored
   * @param shouldExpire A boolean indicating if the cached data should be deleted after the provided ttl
   * @param ttl Expiry time in seconds (only applicable if shouldExpire is true)
   * @returns A promise resolving when the data is stored
   */
  set(key: string, value: string, shouldExpire?: boolean, ttl?: number): Promise<void>;
}
