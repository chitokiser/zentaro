import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PostsService } from '../posts/posts.service';

// @WilliamCater-d8h resolved to this channel ID via the channel page's canonical
// link (https://www.youtube.com/channel/UC1wew-RFqzQqYluuIIOX87g) — YouTube's public
// RSS feed only accepts channel IDs, not @handles.
const YOUTUBE_CHANNEL_ID = 'UC1wew-RFqzQqYluuIIOX87g';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const VIDEO_TAG = '🎬 젠타로 동영상';

interface FeedEntry {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractVideoId(videoUrl: string): string | null {
  const match = videoUrl.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

@Injectable()
export class YoutubeMonitorService {
  private readonly logger = new Logger(YoutubeMonitorService.name);

  constructor(private readonly postsService: PostsService) {}

  // Once a day (08:00 Vietnam time / 01:00 UTC) — check for new uploads on the
  // ZENTARO YouTube channel and turn each unseen one into a webzine post.
  @Cron('0 1 * * *')
  async handleCron() {
    await this.checkNow();
  }

  async checkNow(): Promise<{ created: string[] }> {
    const entries = await this.fetchFeed();
    if (entries.length === 0) {
      this.logger.warn('YouTube monitor: feed returned no entries, skipping.');
      return { created: [] };
    }

    const existingPosts = await this.postsService.list(VIDEO_TAG);
    const knownVideoIds = new Set(
      existingPosts
        .map((post: any) => (post.videoUrl ? extractVideoId(post.videoUrl) : null))
        .filter((id: string | null): id is string => id !== null),
    );

    const newEntries = entries.filter((entry) => !knownVideoIds.has(entry.videoId));
    if (newEntries.length === 0) {
      this.logger.log('YouTube monitor: no new videos since last check.');
      return { created: [] };
    }

    // Oldest first, so the most recently published video ends up with the latest
    // createdAt (posts.service.list sorts newest-createdAt-first).
    newEntries.reverse();

    const createdIds: string[] = [];
    for (const entry of newEntries) {
      const watchUrl = `https://www.youtube.com/watch?v=${entry.videoId}`;
      const paragraphs = entry.description
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
        .join('');
      const contentHtml = paragraphs.length >= 10 ? paragraphs : `<p>${escapeHtml(entry.title)}</p>`;

      try {
        const result = await this.postsService.create(
          {
            title: entry.title,
            contentHtml,
            videoUrl: watchUrl,
            tags: [VIDEO_TAG],
          },
          'admin',
          'ZENTARO YouTube',
        );
        createdIds.push(result.id);
        this.logger.log(`YouTube monitor: created webzine post for "${entry.title}" (${entry.videoId})`);
      } catch (err) {
        this.logger.error(`YouTube monitor: failed to create post for ${entry.videoId}: ${err}`);
      }
    }

    return { created: createdIds };
  }

  private async fetchFeed(): Promise<FeedEntry[]> {
    let xml: string;
    try {
      const res = await fetch(FEED_URL);
      if (!res.ok) {
        this.logger.error(`YouTube monitor: feed fetch failed with status ${res.status}`);
        return [];
      }
      xml = await res.text();
    } catch (err) {
      this.logger.error(`YouTube monitor: feed fetch threw: ${err}`);
      return [];
    }

    const entries: FeedEntry[] = [];
    const entryBlocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    for (const block of entryBlocks) {
      const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const title = block.match(/<title>([^<]*)<\/title>/)?.[1];
      const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
      const description = block.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? '';
      if (!videoId || !title || !published) continue;
      entries.push({
        videoId,
        title: unescapeXml(title),
        description: unescapeXml(description),
        publishedAt: published,
      });
    }
    return entries;
  }
}
