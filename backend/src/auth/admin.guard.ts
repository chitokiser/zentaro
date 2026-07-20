import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { ADMIN_LEVEL_KEY } from './admin-level.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { uid?: string } | undefined;
    if (!user?.uid) {
      throw new UnauthorizedException();
    }
    const requiredLevel =
      this.reflector.getAllAndOverride<1 | 2 | 3>(ADMIN_LEVEL_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 3;

    const snap = await this.db.collection(COLLECTIONS.USERS).doc(user.uid).get();
    const adminLevel: number | undefined = snap.data()?.adminLevel;
    if (!snap.exists || !adminLevel || adminLevel > requiredLevel) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
