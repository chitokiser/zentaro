import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly jwt: JwtService,
  ) {}

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

  private issueToken(uid: string, email: string) {
    const accessToken = this.jwt.sign({ sub: uid, email });
    return { accessToken, uid };
  }
}
