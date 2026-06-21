import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  code: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = (exception as HttpException).getStatus();
      const exceptionResponse = (exception as HttpException).getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          code: this.statusToCode(status),
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        errorResponse = {
          code: (resp.code as string) ?? this.statusToCode(status),
          message: (resp.message as string) ?? (exception as HttpException).message,
        };
      }
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
      },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
