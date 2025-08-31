import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant/company ID from authenticated user
    const user = req.user as any;
    if (user?.company) {
      (req as any).tenantId = user.company;
    }
    next();
  }
}
