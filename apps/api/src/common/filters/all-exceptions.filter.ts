import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

interface ErrorResponse {
  code: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
    } else if (typeof (exception as { status?: number }).status === 'number') {
      // Errors thrown by Express middleware (e.g. body-parser's
      // PayloadTooLargeError) carry an HTTP status but aren't Nest
      // HttpExceptions — surface them cleanly instead of as a generic 500.
      status = (exception as { status: number }).status;
      errorResponse =
        status === HttpStatus.PAYLOAD_TOO_LARGE
          ? {
              code: 'PAYLOAD_TOO_LARGE',
              message: 'الحجم كبير أوي. صغّر الصور أو قلّل عددها وحاول تاني.',
            }
          : { code: this.statusToCode(status), message: (exception as Error).message };
    }

    // OBS-2: report genuine server faults (5xx / non-HTTP throws) to Sentry,
    // tagged with the correlation id. Expected 4xx (validation/authz) are not
    // errors, so they're skipped to keep the signal clean. No-op without a DSN.
    if (status >= 500) {
      Sentry.withScope((scope) => {
        const requestId = (request as { id?: string }).id;
        if (requestId) scope.setTag('request_id', requestId);
        scope.setContext('request', {
          method: request?.method,
          url: request?.url,
        });
        Sentry.captureException(exception);
      });
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
      413: 'PAYLOAD_TOO_LARGE',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }
}
