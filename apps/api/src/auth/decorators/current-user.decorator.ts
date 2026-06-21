import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extract the authenticated user from the request.
 * Optionally specify a property to pick from the user object.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? (user as unknown as Record<string, unknown>)[data] : user;
  },
);
