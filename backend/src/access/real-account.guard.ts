import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth-user.type';

// For routes that read or write data outside any demo visit (leads, bulk
// imports): demo accounts are refused, whatever their role.
@Injectable()
export class RealAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>().user;
    if (user?.demoSessionId) {
      throw new ForbiddenException('Indisponivel na demonstracao.');
    }
    return true;
  }
}
