import winston from 'winston';
import path from 'node:path';
import { PATH_CONSTANTS } from '../constants/pathConstants.js';

export const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.File({
      filename: path.join(PATH_CONSTANTS.rootDir, 'api-gateway.log'),
    }),
  ],
});
