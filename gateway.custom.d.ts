declare namespace Express {
  export interface Request {
    gatewayGlobalConfig?: GatewayGlobalConfigParams;
  }
}

interface GatewayGlobalConfigParams {
  API_PATH: string;
  API_GATEWAY_PORT: number;
}
