import { CacheFactory } from '../adapters/index.js';
import { Redis } from 'ioredis';
import { gatewayConfigObject } from './loadGatewayConfig.js';
import dotenv from 'dotenv';
import Memcached from 'memcached';

// Load env
dotenv.config();

export async function resolveGlobalGatewayConfig() {
  /**
   * To properly configure this gateway, i need to pass the server instance
   * and add and setup necessary middlewares as required, e.g like a bootstrap
   * TODO:
   * Validate required global config params
   * Construct gateway URL prefix : /api/v1/
   * Set port
   * set log_level, configure winston
   * Set up jwt handling
   * Check user role if provided and configure necessary permissions
   * Configure rate limiting
   * Configure logging
   * Setup caching
   *
   */

  try {
    // API version is required
    // console.log(gatewayConfigObject);
    if (!gatewayConfigObject.api_version) {
      throw new Error(`'api_version' is required in the gateway configuration file`);
    }

    const API_VERSION = gatewayConfigObject.api_version;

    // Settings is required
    if (!gatewayConfigObject.settings) {
      throw new Error(`'settings' is required in the gateway configuration file`);
    }

    const globalSettings = gatewayConfigObject.settings;

    // If settings, check if necessary fields are required

    if (!globalSettings.base_path || !globalSettings.port) {
      throw new Error('all configs params under settings are required');
    }

    // Cache settings
    // Check if cache is set in schema and configure the right factory client to use
    if (gatewayConfigObject.cache) {
      const cacheParams = gatewayConfigObject.cache;
      switch (cacheParams.client) {
        case 'redis':
          break;
          CacheFactory.useClient(new Redis());
        case 'memcached':
          CacheFactory.useClient(new Memcached(''));
          break;
      }
    }
    // const redisCache = CacheFactory.useClient(new Redis(process.env.REDIS_URL!));

    // await redisCache.set('hello', 'world', true, 120);
    // const val = await redisCache.get('hello');

    // console.log('Found %s', val);

    // Construct API base path
    const API_PATH = `${globalSettings.base_path}/${API_VERSION}`;
    const API_GATEWAY_PORT = parseInt(globalSettings.port);

    return {
      API_PATH,
      API_GATEWAY_PORT,
    };
  } catch (error: any) {
    console.error(`Error resolving gateway global configuration: ${error.message}`);
    throw error;
  }
}
