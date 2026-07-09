import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    errorCode: ErrorCode,
    message: string,
  ) {
    super({ statusCode: status, errorCode, message }, status);
  }
}
