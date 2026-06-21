import { SetMetadata } from '@nestjs/common';

export const TIER_KEY = 'requiredTier';

/**
 * Require a minimum permission tier to access a route.
 * Lower tier number = higher privilege:
 *   1 = admin, 2 = verified_contributor, 3 = trusted_member, 4 = new_user, 5 = restricted
 *
 * @example
 * @RequireTier(3) // trusted_member or higher (admin, verified_contributor)
 * @Post()
 * createPost() { ... }
 */
export const RequireTier = (tier: number) => SetMetadata(TIER_KEY, tier);
