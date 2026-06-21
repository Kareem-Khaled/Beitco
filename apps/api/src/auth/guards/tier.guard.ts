import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIER_KEY } from '../decorators/require-tier.decorator';

/**
 * Maps PermissionTier enum values to numeric levels.
 * Lower number = higher privilege.
 */
const TIER_LEVELS: Record<string, number> = {
  admin: 1,
  verified_contributor: 2,
  trusted_member: 3,
  new_user: 4,
  restricted: 5,
};

/**
 * Guard that enforces minimum permission tier on routes.
 * Must be used AFTER JwtAuthGuard (user must be authenticated first).
 *
 * @example
 * @RequireTier(3) // requires trusted_member (3) or better (2, 1)
 * @Post()
 * createPost() { ... }
 */
@Injectable()
export class TierGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<number>(TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No tier requirement on this route
    if (requiredTier === undefined || requiredTier === null) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userTierLevel = TIER_LEVELS[user.permissionTier] ?? 5;

    if (userTierLevel > requiredTier) {
      throw new ForbiddenException({
        code: 'TIER_REQUIRED',
        message: `This action requires permission tier ${requiredTier} or higher. Your current tier: ${userTierLevel}`,
        requiredTier,
        currentTier: userTierLevel,
      });
    }

    return true;
  }
}
