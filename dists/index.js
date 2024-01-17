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
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
const { JsonWebTokenError } = jwt;
const gatewayCache = new NodeCache({
    stdTTL: 240,
    checkperiod: 120,
});
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
bootstrapGateway(server, true);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
let gatewayConfigurationObject;
const GATE_BIOLERPLATE = `
# Your boilerplate YAML content goes here

api_version: v1

# Global settings
settings:
  base_path: /api
  port: 3000

# Routes configuration
`;
try {
    const GATE_CONFIG_FILE_PATH = path.resolve(rootDir, 'gate-config.yml');
    if (!fs.existsSync(GATE_CONFIG_FILE_PATH)) {
        // create a new one
        await writeFile('gate-config.yml', GATE_BIOLERPLATE, { encoding: 'utf-8' });
        gatewayConfigurationObject = await yaml.load(GATE_BIOLERPLATE);
    }
    else {
        const gateConfig = await readFile(GATE_CONFIG_FILE_PATH, 'utf-8');
        gatewayConfigurationObject = await yaml.load(gateConfig);
    }
}
catch (error) {
    console.log(error);
    logger.error('Failed to fetch gate-config.yaml file');
    throw new Error('Fail to fetch gate-config file');
}
// console.log(gatewayConfigurationObject);
// Global gateway configuration object
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
server.use(gatewayGlobalConfig.API_PATH, (request, response, next) => {
    try {
        const { path, method } = request;
        const headerPayload = {
            role: 'public',
        };
        const routeResolverResult = resolveEndpointFromRouteList(path, method, headerPayload);
        const cacheKey = `${path}`;
        const resultInCache = gatewayCache.get(cacheKey);
        if (resultInCache) {
            response.status(200).json(resultInCache);
            logger.info('cache hit');
            console.log('cache hit');
            return;
        }
        proxy.on('proxyReq', (proxyRequest, request, response, options) => {
            // proxyRequest.setHeader('x-api-key', 'ejU67ehshJ&');
        });
        // Initialize data here
        let data = [];
        // TODO: Replace data datatype from array to string
        // Response event
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
    }
    catch (error) {
        next(error);
    }
});
// Proxy error handler
proxy.on('error', (err, request, response) => {
    logger.error(`Error forwarding the request: ${err.message}`);
    response.status(500).json({ message: 'Error forwarding the request' });
});
// Global error handling middleware
server.use((err, req, res, next) => {
    logger.error(`An error occured: ${err.message}`);
    res.status(500).json({ message: err.message });
});
const PORT = gatewayGlobalConfig.API_GATEWAY_PORT || process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log('API Gateway server started on port:', PORT);
});
function isValidGateConfig(gateConfigFile) { }
/**
 * Validates a JSON Web Token (JWT).
 * @param token - The JWT to be validated.
 * @param secretKey - The secret key used for JWT verification.
 * @returns {object} The payload if the token is valid.
 * @throws {Error} If the token or secretKey is not provided, or if the token is invalid or expired.
 */
function validateJWT(token, secretKey) {
    try {
        if (!token) {
            throw new Error("Can't validate an empty or undefined token");
        }
        if (!secretKey) {
            throw new Error('Jwt secret not provided');
        }
        const payload = jwt.verify(token, secretKey);
        return payload;
    }
    catch (error) {
        if (error instanceof JsonWebTokenError) {
            throw new Error('Invalid or expired access token');
        }
        throw error;
    }
}
/**
 * Handles Role-Based Access Control (RBAC) by checking if the user role is authorized.
 * @param allowedRoleList - An array of allowed roles for accessing a resource.
 * @param userRole - The role of the user attempting to access the resource.
 * @throws {Error} Throws an error with a descriptive message if access is denied.
 */
function handleRBAC(allowedRoleList, userRole) {
    if (!allowedRoleList.includes(userRole)) {
        throw new Error(`Access denied: role '${userRole}' not authorized.`);
    }
}
/**
 * Handles permission scope control for a resource by checking the user role.
 * @param allowedPermissions - The role of the authenticated user.
 * @param userPermissionScope - A boolean to indicate if the request is a write request or if it modifies data.
 * @throws {Error} Throws an error with a descriptive message if the user doesn't have write permission.
 */
function handlePermissionScope(allowedPermissions, userPermissionScope) {
    if (!allowedPermissions.includes(userPermissionScope)) {
        throw new Error("Access denied: Request doesn't include neccessary permissions.");
    }
}
/**
 *
 * @param path
 * @param method
 */
function resolveEndpointFromRouteList(path, method, authHeader) {
    // It should take the whole request
    try {
        console.log(method, path);
        let jwtPayload = {};
        const definedRouteList = gatewayConfigurationObject.routes;
        // Check path match
        const pathMatchRoute = definedRouteList.find((route) => {
            return route.path === path;
        });
        if (!pathMatchRoute) {
            throw new Error(`Cannot ${method} ${path}`);
        }
        // Check if method is allowed if path match
        const isAllowedMethod = pathMatchRoute.methods.includes(method);
        if (!isAllowedMethod) {
            throw new Error(`Method '${method}' not allowed`);
        }
        console.log('Method allowed?:', isAllowedMethod);
        // Check if authentication is required
        const requiresAuth = pathMatchRoute.authentication.type !== 'none';
        console.log('Requires authentication?:', requiresAuth);
        if (requiresAuth) {
            // Check if user passes auth requirements
            // For now it's jwt
            if (!authHeader.jwt) {
                throw new Error('jwt is missing');
            }
            jwtPayload = validateJWT(authHeader.jwt, 'secret');
        }
        // Check authorization scope
        const authScope = pathMatchRoute.authorization;
        if (authScope && authScope.roles) {
            handleRBAC(authScope.roles, authHeader.role);
        }
        if (authScope && authScope.permissions) {
            handlePermissionScope(authScope.permissions, authHeader.permission);
        }
        // Return redirect url if all is successful, else throw error or return null
        return { target: pathMatchRoute.target, jwtPayload };
    }
    catch (error) {
        console.log('Error resolving endpoint from route list in gateway:', error.message);
        throw error;
    }
}
/**
 * Bootstraps the necessary middlewares based on the config object
 * @param server
 * @param log
 * @returns
 */
function bootstrapGateway(server, log = false) {
    // server.use((request: Request, response: Response, next: NextFunction) => {
    // });
    console.log('Server is bootstraped');
    if (!log) {
        return;
    }
    server.use(morgan('dev'));
}
function resolveGlobalGatewayConfig() {
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
        const gatewayConfigObject = gatewayConfigurationObject;
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
        // Construct API base path
        const API_PATH = `${globalSettings.base_path}/${API_VERSION}`;
        const API_GATEWAY_PORT = parseInt(globalSettings.port);
        return {
            API_PATH,
            API_GATEWAY_PORT,
        };
    }
    catch (error) {
        console.error(`Error resolving gateway global configuration: ${error.message}`);
        throw error;
    }
}
