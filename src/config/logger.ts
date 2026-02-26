import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const traceId = uuidv4(); 
    request['traceId'] = traceId;
    const startTime = new Date();
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const logObject = {
        level: statusCode === 401 ? 'error' : 'info',
        message: `${traceId} ${ip} [${endTime.toISOString()}] "${method} ${originalUrl} HTTP/1.1" ${statusCode} ${duration.toFixed(3)} ms - ${contentLength}`,
      };

      this.logger.log(JSON.stringify(logObject));
    });

    next();
  }
}