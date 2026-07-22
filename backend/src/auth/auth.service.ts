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

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const docRef = await this.usersCol().add({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      points: 0,
      missionsCompleted: 0,
      isAdmin: false,
      source: 'zentaro_web',
      createdAt: FieldValue.serverTimestamp(),
    });

    return this.issueToken(docRef.id, dto.email);
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

    const docRef = await this.usersCol().add({
      email: payload.email,
      displayName: payload.name ?? payload.email,
      photoUrl: payload.picture ?? null,
      points: 0,
      missionsCompleted: 0,
      isAdmin: false,
      source: 'zentaro_web_google',
      createdAt: FieldValue.serverTimestamp(),
    });

    return this.issueToken(docRef.id, payload.email);
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
    const adminLevel: number | null = data.adminLevel ?? null;
    return {
      uid,
      email: data.email ?? null,
      photoUrl: data.photoUrl ?? null,
      isAdmin: adminLevel !== null,
      adminLevel,
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
}
