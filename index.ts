import express, { Express, Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import NodeCache from 'node-cache';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { logger } from './utils/logger';
import { resolveEndpointFromRouteList } from './helpers/resolveEndpointsFromRouteList';
import { bootstrapGateway } from './helpers/bootstrapGateway';
import { resolveGlobalGatewayConfig } from './helpers/resolveGlobalGatewayConfig';

const gatewayCache = new NodeCache({
  stdTTL: 240,
  checkperiod: 120,
});

const server = express();

// gzip compression - 2
server.use(
  compression({
    strategy: 2,
  }),
);

const proxy = httpProxy.createProxyServer({ ssl: false });

bootstrapGateway(server, true);

const gatewayGlobalConfig = resolveGlobalGatewayConfig();

server.use(express.urlencoded({ extended: true }));

server.use((request, response, next) => {
  const start = Date.now();
  next();

  response.on('finish', () => {
    const end = Date.now();
    const latency = end - start;
    console.log(`Request took ${latency}secs`);
  });
});

// Basic
/**
 * Recieves request, sends|maps request to appropriate microservice, returns the response back to the client
 * 1. Request Routing
 * 2. Auth & Auth - Ensuring only authorized users can access certain APIs/Microservice
 * 3. Enforce rate limit/throttling
 * 4. Load balancing
 * 5. caching
 * 6. Logging and monitoring
 * 7. Error handling
 * 8. Predefined rules and configurations for request routing /users --> forward the request to user microservice handling the /users route
 */

// Intermidiate
/**
 * 1. Endpoint aggregation/ combining multiple results from different microservice into a single response
 * 2. Integrating with Service discovery
 */

server.use(gatewayGlobalConfig.API_PATH, (request: Request, response: Response, next: NextFunction) => {
  try {
    const { path, method } = request;

    const headerPayload = {
      role: 'public',
    };

    // URL rewriting can be done here or before

    const routeResolverResult = resolveEndpointFromRouteList(path, method, headerPayload);
    const cacheKey = `${path}`;
    const resultInCache = gatewayCache.get(cacheKey);

    if (resultInCache) {
      response.status(200).json(resultInCache);
      logger.info('cache hit');
      console.log('cache hit');
      return;
    }

    // Perform request transformation if necessary
    proxy.on('proxyReq', (proxyRequest, request, response, options) => {
      // proxyRequest.setHeader('x-api-key', 'ejU67ehshJ&');
    });

    // Initialize data here
    let data: any[] = [];
    // TODO: Replace data datatype from array to string
    // Response event

    // Response transformation here
    proxy.on('proxyRes', (proxyRes) => {
      response.setHeader('Content-Type', 'application/json');
      console.log('Response incoming');
      // Capture response data
      proxyRes.on('data', (chunk) => {
        console.log('cache miss');
        logger.info('cache miss');
        data.push(chunk);
      });

      // Manipulate the response data
      proxyRes.on('end', () => {
        // Convert buffer to string
        const rawData = Buffer.concat(data).toString('utf8');
        console.log(rawData);
        // Parse as JSON
        const jsonData = JSON.parse(rawData);

        // Set cache
        gatewayCache.set(cacheKey, jsonData);
      });
    });
    console.log(routeResolverResult.target);

    proxy.web(request, response, {
      target: routeResolverResult.target,
      timeout: 60000, //60 seconds
    });
  } catch (error) {
    next(error);
  }
});

// Proxy error handler
proxy.on('error', (err, request, response: any) => {
  logger.error(`Error forwarding the request: ${err.message}`);
  response.status(500).json({ message: 'Error forwarding the request' });
});

// Global error handling middleware
server.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`An error occured: ${err.message}`);
  res.status(500).json({ message: err.message });
});

const PORT = gatewayGlobalConfig.API_GATEWAY_PORT || process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log('API Gateway server started on port:', PORT);
});
