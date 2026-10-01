import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { defer, type Observable } from 'rxjs';
import { runWithTenant } from './storage';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request.user?.tenantId ?? 'default';
    const requestedTenant = request.header('x-tenant-id');
    if (requestedTenant && requestedTenant !== tenantId) {
      throw new ForbiddenException('Requested tenant does not match the authenticated session');
    }
    request.tenant = { tenantId };
    return defer(() => runWithTenant({ tenantId }, () => next.handle()));
  }
}
