import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps every successful response in the Beitoon envelope:
 *   { success: true, data, meta? }
 *
 * Conventions:
 *  - If a handler returns `{ data, meta }` (e.g. a paginated result), `meta`
 *    is lifted to the top level alongside `data`.
 *  - Otherwise the raw return value becomes `data`.
 *  - Handlers that already return `{ success: ... }` are passed through
 *    untouched (lets a handler opt out when it needs full control).
 *
 * Errors are handled by AllExceptionsFilter, which emits the matching
 *   { success: false, error: { code, message } }.
 */
export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
}

interface Paginated<T> {
  data: T;
  meta: PaginationMeta;
}

function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Object.keys(value as object).length === 2
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload: unknown) => {
        // Already enveloped (handler opted out) — pass through.
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'success' in payload
        ) {
          return payload;
        }

        // Paginated result { data, meta } -> lift meta to top level.
        if (isPaginated(payload)) {
          return { success: true, data: payload.data, meta: payload.meta };
        }

        // Plain value -> data.
        return { success: true, data: payload };
      }),
    );
  }
}
