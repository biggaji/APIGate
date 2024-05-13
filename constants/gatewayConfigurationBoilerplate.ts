const GATEWAY_CONFIG_BIOLERPLATE = `
api_version: v1

# Global settings
settings:
  base_path: /api
  port: 3000

# Rate Limiting configuration
rate_limiting:
  enabled: true
  max_requests: 5000
  interval: 1d

# Logging configuration
logging:
  format: combined
  log_level: debug
  file:
    enabled: true
    path: /logs/api-gateway.log

# Caching configuration
caching:
  default_ttl: 1000
  max_size: 1000

# Routes configuration
routes:
  - path: /public
    target: http://localhost:3003
    methods: [GET]

`;

export { GATEWAY_CONFIG_BIOLERPLATE };
