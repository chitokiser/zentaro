import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

export type PostSource = 'ai' | 'admin';

const WEBZINE_BASE_URL = 'https://zentaro.netlify.app/webzine';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractThumbnail(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

function toIso(ts: { _seconds: number } | undefined | null): string | null {
  return ts ? new Date(ts._seconds * 1000).toISOString() : null;
}

@Injectable()
export class PostsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_POSTS);
  }

  /** Normalized, crawler-friendly shape for external consumption (ISO dates, extracted thumbnail, plain-text excerpt). */
  toFeedItem(post: any) {
    const contentText = stripHtml(post.contentHtml ?? '');
    return {
      id: post.id,
      url: `${WEBZINE_BASE_URL}/${post.id}`,
      title: post.title,
      excerpt: contentText.length > 200 ? `${contentText.slice(0, 200)}…` : contentText,
      contentHtml: post.contentHtml,
      contentText,
      thumbnailUrl: extractThumbnail(post.contentHtml ?? ''),
      videoUrl: post.videoUrl ?? null,
      tags: post.tags ?? [],
      author: post.authorName,
      source: post.source,
      publishedAt: toIso(post.createdAt),
      updatedAt: toIso(post.updatedAt),
    };
  }

  async listFeed(tag?: string) {
    const posts = await this.list(tag);
    return posts.map((post) => this.toFeedItem(post));
  }

  async getFeedItem(id: string) {
    const post = await this.getOne(id);
    return this.toFeedItem(post);
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

  // Site-wide: an image already used on any past post must never be reused.
  async getUsedImageUrls(): Promise<Set<string>> {
    const snap = await this.col().get();
    const urls = new Set<string>();
    for (const doc of snap.docs) {
      const data = doc.data() as { contentHtml?: string };
      const match = data.contentHtml?.match(/<img[^>]+src="([^"]+)"/);
      if (match) urls.add(match[1]);
    }
    return urls;
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
      titleKo: dto.titleKo ?? null,
      titleEn: dto.titleEn ?? null,
      titleVi: dto.titleVi ?? null,
      contentHtmlKo: dto.contentHtmlKo ?? null,
      contentHtmlEn: dto.contentHtmlEn ?? null,
      contentHtmlVi: dto.contentHtmlVi ?? null,
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
