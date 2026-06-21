import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT Auth Guard.
 * - By default, all routes require a valid JWT Bearer token.
 * - Use @Public() decorator to mark routes as publicly accessible.
 * - On @Public() routes, still attempts to extract the user from a
 *   Bearer token if one is present (for optional auth).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // On public routes, try to authenticate silently.
      // If a valid token is present, req.user will be populated.
      // If no token or invalid token, just proceed without user.
      try {
        await super.canActivate(context);
      } catch {
        // Ignore auth errors on public routes
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
