import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
import { PostsService } from '../posts/posts.service';
import { WEBZINE_TAGS } from '../common/webzine-tags';
import { CrossPostService } from '../cross-post/cross-post.service';

const GEMINI_MODEL = 'gemini-2.5-flash';

const IMAGE_QUERY_BY_TAG: Record<string, string> = {
  '🥃 증류주': 'whiskey barrel distillery',
  '🌿 보태니컬': 'botanical herbs gin',
  '🧪 증류기술': 'copper still distillation',
  '🍖 미식(치즈·햄·훈제·BBQ)': 'charcuterie cheese smoked bbq',
  '💪 기능성음료&칵테일': 'craft cocktail bar',
  '👑 ZenTaro Story': 'luxury whiskey lifestyle',
};

// ZENTARO's own video/CF content is posted manually by admins, not AI-generated.
const AI_EXCLUDED_TAGS = new Set(['🎬 젠타로 동영상']);
const AI_TAGS = WEBZINE_TAGS.filter((t) => !AI_EXCLUDED_TAGS.has(t));

@Injectable()
export class AiWriterService {
  private readonly logger = new Logger(AiWriterService.name);
  private readonly anthropic: Anthropic | null;
  private readonly geminiApiKey: string | null;
  private readonly pexelsApiKey: string | null;
  private tagCursor = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly postsService: PostsService,
    private readonly crossPostService: CrossPostService,
  ) {
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || null;
    this.pexelsApiKey = this.config.get<string>('PEXELS_API_KEY') || null;
  }

  private nextTag(): string {
    const tag = AI_TAGS[this.tagCursor % AI_TAGS.length];
    this.tagCursor += 1;
    return tag;
  }

  // Once a day, one article per category (6 tags = 6 posts/day).
  @Cron('0 9 * * *')
  async handleCron() {
    for (const tag of AI_TAGS) {
      await this.generateOne(tag);
    }
  }

  async generateOne(tag?: string) {
    if (!this.geminiApiKey && !this.anthropic) {
      this.logger.warn(
        'Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY set — skipping AI webzine post generation.',
      );
      return null;
    }

    const chosenTag = tag ?? this.nextTag();

    const prompt = `당신은 프리미엄 크래프트 증류소 브랜드 "ZENTARO"가 운영하는 술/미식 웹진의 에디터입니다.
"${chosenTag}"를 주제로, ZENTARO Mall(쇼핑몰) 방문객이 흥미롭게 읽을 만한 한국어 웹진 아티클을 한 편 작성하세요.

요구사항:
- 실제 존재하지 않는 특정 최신 사건/통계/인물을 사실인 것처럼 단정하지 말고, 일반적인 지식·트렌드·팁·페어링 아이디어 중심으로 작성
- 분량: 600~900자 내외의 본문
- 형식: 소제목(h3), 문단(p), 필요시 목록(ul/li)을 사용한 HTML 조각 (html/head/body 태그 없이 본문 내용만)
- 어조: 고급스럽고 신뢰감 있는 매거진 톤

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"title": "기사 제목", "contentHtml": "<h3>...</h3><p>...</p>"}`;

    const rawText = this.geminiApiKey
      ? await this.callGemini(prompt)
      : await this.callAnthropic(prompt);

    if (!rawText) {
      this.logger.error('AI writer: no text content in response');
      return null;
    }

    let parsed: { title: string; contentHtml: string };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      this.logger.error('AI writer: failed to parse JSON response');
      return null;
    }

    const imageUrl = await this.fetchFreeImage(chosenTag);
    const contentHtml = imageUrl
      ? `<img src="${imageUrl}" alt="${parsed.title}" style="width:100%;border-radius:12px;margin-bottom:1.5rem;" />${parsed.contentHtml}`
      : parsed.contentHtml;

    const result = await this.postsService.create(
      {
        title: parsed.title,
        contentHtml,
        tags: [chosenTag],
      },
      'ai',
      'ZENTARO AI',
    );
    this.logger.log(`AI webzine post created: "${parsed.title}" (${chosenTag})`);

    this.crossPostService
      .postEverywhere({
        id: result.id,
        title: parsed.title,
        contentHtml,
        imageUrl,
      })
      .catch((err) => this.logger.error(`Cross-posting failed: ${err}`));

    return result;
  }

  private async fetchFreeImage(tag: string): Promise<string | null> {
    if (!this.pexelsApiKey) return null;
    const query = IMAGE_QUERY_BY_TAG[tag] ?? 'craft spirits bar';
    // Pick a random page each time so repeated calls for the same tag draw
    // from a wide pool instead of always returning the same top result.
    const page = 1 + Math.floor(Math.random() * 5);
    try {
      const [usedUrls, res] = await Promise.all([
        this.postsService.getUsedImageUrls(tag),
        fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
          { headers: { Authorization: this.pexelsApiKey } },
        ),
      ]);
      if (!res.ok) {
        this.logger.warn(`Pexels API error (${res.status}) for query "${query}"`);
        return null;
      }
      const body = await res.json();
      const photos: Array<{ src?: { large?: string } }> = body?.photos ?? [];
      const candidates = photos.map((p) => p.src?.large).filter((u): u is string => typeof u === 'string');
      const unused = candidates.filter((u) => !usedUrls.has(u));
      const pool = unused.length > 0 ? unused : candidates;
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    } catch (err) {
      this.logger.warn(`Pexels fetch failed for query "${query}": ${err}`);
      return null;
    }
  }

  private async callGemini(prompt: string): Promise<string | null> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      this.logger.error(`Gemini API error: ${JSON.stringify(body)}`);
      return null;
    }
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text : null;
  }

  private async callAnthropic(prompt: string): Promise<string | null> {
    if (!this.anthropic) return null;
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = message.content.find((block) => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : null;
  }
}
