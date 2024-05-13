import { Express } from 'express';
import morgan from 'morgan';

/**
 * Bootstraps the necessary middlewares based on the config object
 * @param server
 * @param log
 * @returns
 */

export function bootstrapGateway(server: Express, log: boolean = false) {
  // server.use((request: Request, response: Response, next: NextFunction) => {
  // });
  console.log('Server is bootstraped');
  if (!log) {
    return;
  }

  server.use(morgan('dev'));
}
