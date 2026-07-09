import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ErrorCode } from '../errors/error-codes';

@Catch()
export class GqlHttpExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    GqlArgumentsHost.create(host);

    if (exception instanceof GraphQLError) {
      return exception;
    }

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : 500;

    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(exception);
    }

    const httpResponse = isHttp ? exception.getResponse() : null;
    const responseObj =
      httpResponse && typeof httpResponse === 'object' && !Array.isArray(httpResponse)
        ? (httpResponse as Record<string, unknown>)
        : null;

    const message =
      (Array.isArray(responseObj?.message)
        ? responseObj.message.join(', ')
        : (responseObj?.message as string | undefined)) ??
      (isHttp ? exception.message : undefined) ??
      'Internal server error';

    const errorCode =
      (responseObj?.errorCode as number | undefined) ??
      (status === 401
        ? ErrorCode.UNAUTHENTICATED
        : status === 403
          ? ErrorCode.FORBIDDEN
          : status === 404
            ? ErrorCode.NOT_FOUND
            : status === 409
              ? ErrorCode.CONFLICT
              : status >= 500
                ? ErrorCode.INTERNAL_ERROR
                : ErrorCode.BAD_REQUEST);

    let code = 'INTERNAL_SERVER_ERROR';
    if (status === 400) code = 'BAD_USER_INPUT';
    if (status === 401) code = 'UNAUTHENTICATED';
    if (status === 403) code = 'FORBIDDEN';
    if (status === 404) code = 'NOT_FOUND';
    if (status === 409) code = 'CONFLICT';

    return new GraphQLError(message, {
      extensions: {
        code,
        errorCode,
        http: { status },
      },
    });
  }
}
