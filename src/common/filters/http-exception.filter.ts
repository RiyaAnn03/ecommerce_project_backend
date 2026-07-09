import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../errors/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Only handle REST requests; GraphQL uses GqlHttpExceptionFilter.
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : null;
    const payload =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : null;

    const message =
      (Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : (payload?.message as string | undefined)) ??
      (isHttp ? exception.message : undefined) ??
      'Internal server error';

    const errorCode =
      (payload?.errorCode as number | undefined) ??
      (status === HttpStatus.UNAUTHORIZED
        ? ErrorCode.UNAUTHENTICATED
        : status === HttpStatus.FORBIDDEN
          ? ErrorCode.FORBIDDEN
          : status === HttpStatus.NOT_FOUND
            ? ErrorCode.NOT_FOUND
            : status === HttpStatus.CONFLICT
              ? ErrorCode.CONFLICT
              : status >= 500
                ? ErrorCode.INTERNAL_ERROR
                : ErrorCode.BAD_REQUEST);

    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
    });
  }
}
