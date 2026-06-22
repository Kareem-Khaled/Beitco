import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

// Allows only platform admins (isAdmin). Use after the global JwtAuthGuard.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!req.user?.isAdmin) {
      throw new ForbiddenException({ code: 'ADMIN_ONLY', message: 'الصفحة دي للأدمن بس.' });
    }
    return true;
  }
}
