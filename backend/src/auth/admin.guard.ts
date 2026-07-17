import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { uid?: string } | undefined;
    if (!user?.uid) {
      throw new UnauthorizedException();
    }
    const snap = await this.db.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!snap.exists || !snap.data()?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
