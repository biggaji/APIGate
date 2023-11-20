import express from 'express';
import httpProxy from 'http-proxy';
import fs from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import NodeCache from 'node-cache';
import winston from 'winston';
import compression from 'compression';
const gatewayCache = new NodeCache();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();
const logger = winston.createLogger({
    level: 'debug',
    transports: [
        new winston.transports.File({
            filename: path.join(rootDir, 'api-gateway.log'),
        }),
    ],
});
const server = express();
server.use(compression());
const proxy = httpProxy.createProxyServer({ ssl: false });
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
let gateRouterObject;
const GATE_BIOLERPLATE = `
# Your boilerplate YAML content goes here
api_version: v1
services:
  rest_apis:
    user_service:
      base_url: http://127.0.0.1:3001
      methods: ['GET', 'POST']
  graphql_apis:
    order_service:
      - base_url: http://127.0.0.1:3002/graphql
      - method: ['POST']
`;
try {
    const GATE_CONFIG_FILE_PATH = path.resolve(rootDir, 'gate-config.yml');
    if (!fs.existsSync(GATE_CONFIG_FILE_PATH)) {
        // create a new one
        await writeFile('gate-config.yml', GATE_BIOLERPLATE, { encoding: 'utf-8' });
        gateRouterObject = await yaml.load(GATE_BIOLERPLATE);
    }
    else {
        const gateConfig = await readFile(GATE_CONFIG_FILE_PATH, 'utf-8');
        gateRouterObject = await yaml.load(gateConfig);
    }
}
catch (error) {
    console.log(error);
    logger.error('Failed to fetch gate-config.yaml file');
    throw new Error('Fail to fetch gate-config file');
}
// console.log(gateRouterObject);
server.use(express.urlencoded({ extended: false }));
// server.use(express.json());
server.use((request, response, next) => {
    const start = Date.now();
    next();
    response.on('finish', () => {
        const end = Date.now();
        const latency = end - start;
        console.log(`Latency: ${latency}secs`);
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
// Advanced
server.use('/api-gate', (request, response, next) => {
    try {
        const { path, method } = request;
        const cacheKey = `${path}`;
        const resultInCache = gatewayCache.get(cacheKey);
        if (resultInCache) {
            response.status(200).json(resultInCache);
            logger.info('cache hit');
            console.log('cache hit');
            return;
        }
        proxy.on('proxyReq', (proxyRequest, request, response, options) => {
            // console.log(proxyRequest.getHeaders());
            proxyRequest.setHeader('x-api-key', 'ejU67ehshJ&');
            // console.log(request.query, request.body);
        });
        // Initialize data here
        let data = [];
        // Response event
        proxy.on('proxyRes', (proxyRes) => {
            response.setHeader('Content-Type', 'application/json');
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
                // Parse as JSON
                const jsonData = JSON.parse(rawData);
                // Set cache
                gatewayCache.set(cacheKey, jsonData);
            });
        });
        proxy.web(request, response, {
            target: 'http://localhost:3001/users',
        });
        console.log(path, method);
    }
    catch (error) {
        next(error);
    }
});
// Handle proxy error
proxy.on('error', (err, request, response) => {
    logger.error('Error forwarding the request');
    response.status(500).json({ message: 'Error forwarding the request' });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('API Gateway server started on port:', PORT);
});
function isValidGateConfig(gateConfigFile) { }
