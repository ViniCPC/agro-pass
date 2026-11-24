import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { requestIdOf } from './request-context.middleware';

interface ErrorDescription {
  status: number;
  error: string;
  message: string | string[];
}

// Prisma errors that reach the API are client errors, not crashes.
const PRISMA_ERRORS: Record<string, ErrorDescription> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'Registro duplicado.',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'Registro relacionado inexistente ou em uso.',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    message: 'Registro nao encontrado.',
  },
};

const INTERNAL_ERROR: ErrorDescription = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  error: 'Internal Server Error',
  message: 'Erro interno do servidor.',
};

function describe(exception: unknown): ErrorDescription {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status >= 500) return { ...INTERNAL_ERROR, status };
    if (status === Number(HttpStatus.TOO_MANY_REQUESTS)) {
      return {
        status,
        error: 'Too Many Requests',
        message: 'Muitas requisicoes. Tente novamente em instantes.',
      };
    }

    const body = exception.getResponse();
    const details =
      typeof body === 'string'
        ? { message: body }
        : (body as { message?: string | string[]; error?: string });
    return {
      status,
      error: details.error ?? exception.name,
      message: details.message ?? exception.message,
    };
  }

  const isPrismaError =
    exception instanceof Error &&
    exception.constructor.name.startsWith('PrismaClient') &&
    'code' in exception &&
    typeof exception.code === 'string';
  if (isPrismaError) {
    return PRISMA_ERRORS[exception.code as string] ?? INTERNAL_ERROR;
  }

  return INTERNAL_ERROR;
}

// One error shape for the whole API, always carrying the request id so a
// user report can be matched to the logs. Unexpected errors never leak
// their internals to the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = requestIdOf(response);
    const path = request.originalUrl.split('?')[0];
    const { status, error, message } = describe(exception);

    if (status >= 500) {
      // Driver messages/stacks may include SQL parameters and connection URLs.
      this.logger.error({
        requestId,
        method: request.method,
        path,
        errorType: exception instanceof Error ? exception.name : 'UnknownError',
      });
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      requestId,
      path,
      timestamp: new Date().toISOString(),
    });
  }
}
