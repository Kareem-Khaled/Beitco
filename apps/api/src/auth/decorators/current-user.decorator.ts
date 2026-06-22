import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  isAdmin: boolean;
  verified: boolean;
  verificationStatus: string;
}

// Injects the authenticated user (set by JwtStrategy.validate) into a handler.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return req.user;
  },
);
