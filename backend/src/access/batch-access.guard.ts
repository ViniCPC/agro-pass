import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth-user.type';
import { AccessService } from './access.service';

// For controllers whose routes carry a batch id as :id. Runs after the JWT
// guard: a batch the user may not see answers 404 before any handler runs,
// including routes added later.
@Injectable()
export class BatchAccessGuard implements CanActivate {
  constructor(private readonly access: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const id = request.params?.id;
    if (typeof id === 'string' && request.user) {
      await this.access.assertBatch(id, request.user);
    }
    return true;
  }
}
