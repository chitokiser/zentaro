import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

export type PostSource = 'ai' | 'admin';

@Injectable()
export class PostsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_POSTS);
  }

  async list(tag?: string) {
    const snap = await this.col().where('published', '==', true).get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((post: any) => !tag || (post.tags ?? []).includes(tag))
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
  }

  async listAllAdmin() {
    const snap = await this.col().get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt?._seconds ?? 0) - (a.createdAt?._seconds ?? 0));
  }

  async getOne(id: string) {
    const snap = await this.col().doc(id).get();
    if (!snap.exists) {
      throw new NotFoundException('Post not found');
    }
    return { id: snap.id, ...snap.data() };
  }

  async create(
    dto: CreatePostDto,
    source: PostSource,
    authorName: string,
  ) {
    const docRef = await this.col().add({
      title: dto.title,
      contentHtml: dto.contentHtml,
      videoUrl: dto.videoUrl ?? null,
      tags: dto.tags,
      source,
      authorName,
      published: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  async update(id: string, dto: UpdatePostDto) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Post not found');
    }
    await ref.update({ ...dto, updatedAt: FieldValue.serverTimestamp() });
    return { id };
  }

  async remove(id: string) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Post not found');
    }
    await ref.delete();
    return { id };
  }
}
