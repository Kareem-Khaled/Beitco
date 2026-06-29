import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Optional JWT auth: attaches the user when a valid token is present, but never
// rejects anonymous requests. Use on otherwise-public routes that reveal extra
// data to a signed-in owner/admin — e.g. previewing a not-yet-published listing
// from the moderation queue. Pair with @Public() so the global JwtAuthGuard
// steps aside and lets this optional pass run.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Don't throw on a missing/invalid token — just resolve with no user.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }

  // Keep the signature satisfied; the base implementation runs passport.
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
