import express, { Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import fs from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();

const server = express();
const proxy = httpProxy.createProxyServer({ ssl: false });

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

let gateRouterObject: any;
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
  } else {
    const gateConfig = await readFile(GATE_CONFIG_FILE_PATH, 'utf-8');
    gateRouterObject = await yaml.load(gateConfig);
  }
} catch (error) {
  console.log(error);
  throw new Error('Fail to fetch gate-config file');
}

console.log(gateRouterObject);

server.use(express.urlencoded({ extended: false }));
// server.use(express.json());

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

server.use((request: Request, response: Response, next: NextFunction) => {
  try {
    const { path, method } = request;

    proxy.on('proxyReq', (proxyRequest, request, response, options) => {
      // console.log(proxyRequest.getHeaders());
      proxyRequest.setHeader('x-api-key', 'ejU67ehshJ&');
      // console.log(request.query, request.body);
    });

    // Response event
    proxy.on('proxyRes', (proxyRes) => {
      // Initialize data here
      let data: any;

      // Capture response data
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      // Manipulate the response data
      proxyRes.on('end', () => {
        response.end(data);
      });
    });

    proxy.web(request, response, {
      target: 'http://localhost:3001/users',
    });

    console.log(path, method);
  } catch (error) {
    next(error);
  }
});

// Handle proxy error
proxy.on('error', (err, request, response: any) => {
  response.status(500).json({ message: 'Error forwarding the request' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('API Gateway server started on port:', PORT);
});
