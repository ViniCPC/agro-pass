import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const ACCEPTED_REQUEST_ID = /^[\w.-]{1,100}$/;

export function requestIdOf(response: Response): string | undefined {
  return (response.locals as { requestId?: string }).requestId;
}

// Gives every request an id (kept from a trusted proxy header when well
// formed), echoes it back and logs one structured line when the response
// finishes. Health probes are not logged: platforms poll them constantly.
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const incoming = request.header(REQUEST_ID_HEADER);
    const requestId =
      incoming && ACCEPTED_REQUEST_ID.test(incoming) ? incoming : randomUUID();

    (response.locals as { requestId?: string }).requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    const startedAt = process.hrtime.bigint();
    response.on('finish', () => {
      const path = request.originalUrl.split('?')[0];
      if (path.startsWith('/health')) return;

      const entry = {
        requestId,
        method: request.method,
        path,
        statusCode: response.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
      };

      if (response.statusCode >= 500) this.logger.error(entry);
      else if (response.statusCode >= 400) this.logger.warn(entry);
      else this.logger.log(entry);
    });

    next();
  }
}
