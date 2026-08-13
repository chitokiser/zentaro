import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ShippingAddressDto } from './dto/shipping-address.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private usersCol() {
    return this.db.collection(COLLECTIONS.USERS);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersCol()
      .where('email', '==', dto.email)
      .limit(1)
      .get();
    if (!existing.empty) {
      throw new ConflictException('Email already registered');
    }

    const mentor = await this.resolveMentor(dto.referrerEmail, dto.email);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const docRef = await this.usersCol().add({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      points: 0,
      missionsCompleted: 0,
      isAdmin: false,
      source: 'zentaro_web',
      referredBy: mentor?.uid ?? null,
      referredByEmail: mentor?.email ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Grant 5,000 EXP signup bonus to mentor (fire-and-forget)
    if (mentor?.uid) {
      this.grantMentorSignupExp(mentor.uid, dto.email).catch((e) =>
        console.error('[register] grantMentorSignupExp failed:', e),
      );
    }

    return this.issueToken(docRef.id, dto.email);
  }

  /**
   * Every member must have a mentor: use the referrer email they entered at
   * signup if it resolves to a real (and different) account, otherwise fall
   * back to the site's designated admin account (first ADMIN_EMAILS entry).
   * Returns null only in the bootstrap edge case where that admin account
   * hasn't registered yet.
   */
  private async resolveMentor(
    referrerEmail: string | undefined,
    newUserEmail: string,
  ): Promise<{ uid: string; email: string } | null> {
    if (referrerEmail && referrerEmail.toLowerCase() !== newUserEmail.toLowerCase()) {
      const snap = await this.usersCol()
        .where('email', '==', referrerEmail)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        return { uid: doc.id, email: doc.data().email ?? referrerEmail };
      }
    }

    const adminEmail = this.config
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)[0];
    if (!adminEmail) return null;

    const adminSnap = await this.usersCol().where('email', '==', adminEmail).limit(1).get();
    if (adminSnap.empty) return null;
    const adminDoc = adminSnap.docs[0];
    return { uid: adminDoc.id, email: adminDoc.data().email ?? adminEmail };
  }

  async login(dto: LoginDto) {
    const snap = await this.usersCol()
      .where('email', '==', dto.email)
      .limit(1)
      .get();
    if (snap.empty) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const doc = snap.docs[0];
    const data = doc.data();
    const passwordHash: string | undefined = data.passwordHash;
    if (!passwordHash || !(await bcrypt.compare(dto.password, passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(doc.id, dto.email);
  }

  async googleLogin(dto: GoogleLoginDto) {
    const audience = this.config.get<string>('GOOGLE_CLIENT_ID');
    let payload: { email?: string; name?: string; picture?: string } | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const existing = await this.usersCol()
      .where('email', '==', payload.email)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return this.issueToken(doc.id, payload.email);
    }

    const mentor = await this.resolveMentor(dto.referrerEmail, payload.email);

    const docRef = await this.usersCol().add({
      email: payload.email,
      displayName: payload.name ?? payload.email,
      photoUrl: payload.picture ?? null,
      points: 0,
      missionsCompleted: 0,
      isAdmin: false,
      source: 'zentaro_web_google',
      referredBy: mentor?.uid ?? null,
      referredByEmail: mentor?.email ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Grant 5,000 EXP signup bonus to mentor (fire-and-forget)
    if (mentor?.uid) {
      this.grantMentorSignupExp(mentor.uid, payload.email).catch((e) =>
        console.error('[googleLogin] grantMentorSignupExp failed:', e),
      );
    }

    return this.issueToken(docRef.id, payload.email);
  }

  /** Inlined referral signup EXP grant to avoid circular WalletModule dependency. */
  private async grantMentorSignupExp(mentorUid: string, menteeEmail: string): Promise<void> {
    const SIGNUP_REFERRAL_EXP = 5000;
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(mentorUid);
    await this.db.runTransaction(async (tx) => {
      tx.set(walletRef, { exp: FieldValue.increment(SIGNUP_REFERRAL_EXP) }, { merge: true });
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: mentorUid,
        amount: SIGNUP_REFERRAL_EXP,
        type: 'referral_signup_reward',
        description: `신규 추천 가입 보상 (멘티: ${menteeEmail})`,
        menteeEmail,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  }

  private isAdminEmail(email: string): boolean {
    const adminEmails = this.config
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(email.toLowerCase());
  }

  private async issueToken(uid: string, email: string) {
    // ADMIN_EMAILS always gets (or keeps) top-tier access; it never
    // downgrades an existing higher-privilege assignment on repeat login.
    if (this.isAdminEmail(email)) {
      await this.usersCol().doc(uid).set({ adminLevel: 1, isAdmin: true }, { merge: true });
    }
    const snap = await this.usersCol().doc(uid).get();
    const adminLevel: number | null = snap.data()?.adminLevel ?? null;
    const accessToken = this.jwt.sign({ sub: uid, email });
    return { accessToken, uid, isAdmin: adminLevel !== null, adminLevel };
  }

  async getMe(uid: string) {
    const snap = await this.usersCol().doc(uid).get();
    const data = snap.data() ?? {};
    const email: string | null = data.email ?? null;
    let adminLevel: number | null = data.adminLevel ?? null;

    // Self-heal on every call, not just login: a protected ADMIN_EMAILS
    // account must never be stuck below level 1 (e.g. after someone
    // fat-fingers a level-2/3 button on their own row in the admin list).
    if (email && this.isAdminEmail(email) && adminLevel !== 1) {
      await this.usersCol().doc(uid).set({ adminLevel: 1, isAdmin: true }, { merge: true });
      adminLevel = 1;
    }

    return {
      uid,
      email,
      photoUrl: data.photoUrl ?? null,
      isAdmin: adminLevel !== null,
      adminLevel,
      hasPaymentPassword: !!data.paymentPasswordHash,
      hasLoginPassword: !!data.passwordHash,
    };
  }

  /**
   * 최고관리자(level 1) only: list users who hold any admin tier, so the
   * member-management screen has something to edit without dumping the
   * entire (potentially huge) regular-user table.
   */
  async listAdminUsers() {
    const snap = await this.usersCol().where('adminLevel', 'in', [1, 2, 3]).get();
    return snap.docs.map((doc) => ({
      uid: doc.id,
      email: doc.data().email ?? null,
      displayName: doc.data().displayName ?? null,
      adminLevel: doc.data().adminLevel ?? null,
    }));
  }

  async setAdminLevel(targetUid: string, adminLevel: number | null, requestingEmail: string) {
    const targetSnap = await this.usersCol().doc(targetUid).get();
    if (!targetSnap.exists) {
      throw new ConflictException('User not found');
    }
    this.assertNotProtectedAdminEmail(targetSnap.data()?.email, requestingEmail);
    await this.usersCol().doc(targetUid).set(
      { adminLevel, isAdmin: adminLevel !== null },
      { merge: true },
    );
    return { uid: targetUid, adminLevel };
  }

  /** Promotes a not-yet-admin user to an admin tier by email. */
  async promoteByEmail(email: string, adminLevel: 1 | 2 | 3, requestingEmail: string) {
    const snap = await this.usersCol().where('email', '==', email).limit(1).get();
    if (snap.empty) {
      throw new ConflictException('해당 이메일의 회원을 찾을 수 없습니다.');
    }
    const doc = snap.docs[0];
    this.assertNotProtectedAdminEmail(doc.data().email, requestingEmail);
    await doc.ref.set({ adminLevel, isAdmin: true }, { merge: true });
    return { uid: doc.id, email: doc.data().email, adminLevel };
  }

  private assertNotProtectedAdminEmail(targetEmail: string | undefined, requestingEmail: string) {
    // ADMIN_EMAILS members are re-promoted to level 1 on every login, so
    // changing their tier here would silently revert; refuse instead of lying.
    if (targetEmail && this.isAdminEmail(targetEmail) && targetEmail.toLowerCase() !== requestingEmail.toLowerCase()) {
      throw new ConflictException('ADMIN_EMAILS로 지정된 계정은 등급을 변경할 수 없습니다.');
    }
  }

  async getShippingAddress(uid: string) {
    const snap = await this.usersCol().doc(uid).get();
    return snap.data()?.shippingAddress ?? null;
  }

  async updateShippingAddress(uid: string, dto: ShippingAddressDto) {
    const shippingAddress = {
      recipientName: dto.recipientName,
      phone: dto.phone,
      postalCode: dto.postalCode,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 ?? null,
      deliveryMemo: dto.deliveryMemo ?? null,
    };
    await this.usersCol().doc(uid).set({ shippingAddress }, { merge: true });
    return shippingAddress;
  }

  /** Mentor page data: who referred me, who I referred, and total EXP earned from their purchases. */
  async getMentorDashboard(uid: string) {
    const selfSnap = await this.usersCol().doc(uid).get();
    const referredByUid: string | null = selfSnap.data()?.referredBy ?? null;

    let referrer: { uid: string; email: string | null; displayName: string | null } | null = null;
    if (referredByUid) {
      const referrerSnap = await this.usersCol().doc(referredByUid).get();
      if (referrerSnap.exists) {
        referrer = {
          uid: referrerSnap.id,
          email: referrerSnap.data()?.email ?? null,
          displayName: referrerSnap.data()?.displayName ?? null,
        };
      }
    }

    const referredSnap = await this.usersCol().where('referredBy', '==', uid).get();
    const referredMembers = referredSnap.docs
      .map((doc) => ({
        uid: doc.id,
        email: doc.data().email ?? null,
        displayName: doc.data().displayName ?? null,
        createdAt: doc.data().createdAt ?? null,
      }))
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));

    const rewardSnap = await this.db
      .collection(COLLECTIONS.TRANSACTIONS)
      .where('userId', '==', uid)
      .where('type', '==', 'mentor_referral_reward')
      .get();
    const totalEarnedExp = rewardSnap.docs.reduce((sum, doc) => sum + (doc.data().amount ?? 0), 0);

    const referredPurchases = rewardSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount ?? 0,
          description: data.description ?? '',
          referredUserEmail: data.referredUserEmail ?? null,
          referredUserId: data.referredUserId ?? null,
          purchaseAmountAp: data.purchaseAmountAp ?? 0,
          rewardLevel: data.rewardLevel ?? 1,
          createdAt: data.createdAt ?? null,
        };
      })
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));

    return { referrer, referredMembers, totalEarnedExp, referredPurchases };
  }

  /**
   * Sets or replaces the member's email+password login credential. Members
   * who signed up via Google never got a passwordHash, so if Google sign-in
   * is ever unavailable to them (blocked in-app browser, lost session on a
   * new device, ...) they have zero way back into their own account. This
   * lets any logged-in member add that fallback themselves.
   */
  async setPassword(uid: string, password: string): Promise<{ success: boolean }> {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersCol().doc(uid).set({ passwordHash }, { merge: true });
    return { success: true };
  }

  /** Specifies payment password (6-digit PIN) for the user. */
  async setPaymentPassword(uid: string, pin: string): Promise<{ success: boolean }> {
    if (!/^\d{6}$/.test(pin)) {
      throw new ConflictException('자금이체 비밀번호는 숫자 6자리여야 합니다.');
    }
    const hash = await bcrypt.hash(pin, 10);
    await this.usersCol().doc(uid).set({ paymentPasswordHash: hash }, { merge: true });
    return { success: true };
  }

  /** Verifies payment password (6-digit PIN). Throws on mismatch. */
  async verifyPaymentPassword(uid: string, paymentPassword?: string): Promise<void> {
    if (!paymentPassword) {
      throw new ConflictException('자금이체 비밀번호를 입력해주세요.');
    }
    const snap = await this.usersCol().doc(uid).get();
    const hash = snap.exists ? snap.data()?.paymentPasswordHash : null;
    if (!hash) {
      throw new ConflictException('자금이체 비밀번호가 설정되어 있지 않습니다. 먼저 설정해주세요.');
    }
    const matches = await bcrypt.compare(paymentPassword, hash);
    if (!matches) {
      throw new ConflictException('자금이체 비밀번호가 일치하지 않습니다.');
    }
  }
}
