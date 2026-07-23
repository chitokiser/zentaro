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
  '🧘 젠(禪)&불교철학': 'zen garden meditation temple',
};

const SYSTEM_PROMO_TAG = '📰 ZenTaro 카드뉴스';

// ZENTARO's own video/CF content is posted manually by admins; the system-promo card
// news has its own dedicated cron (handleSystemPromoCron), so both are excluded here.
const AI_EXCLUDED_TAGS = new Set(['🎬 젠타로 동영상', SYSTEM_PROMO_TAG]);
const AI_TAGS = WEBZINE_TAGS.filter((t) => !AI_EXCLUDED_TAGS.has(t));

interface SystemPromoTopic {
  id: string;
  /** Korean context fed into the prompt describing what the feature is/does. */
  topicKo: string;
  /** Vietnamese call-to-action button label. */
  ctaVi: string;
  /** Relative path the CTA button links to. */
  href: string;
  imageQuery: string;
}

// Rotates through ZenTaro's own reward/commerce systems for the every-6-hours
// "card news" promo post — one topic per run, cycling back to the start.
const SYSTEM_PROMO_TOPICS: SystemPromoTopic[] = [
  {
    id: 'barrel_reserve',
    topicKo:
      'Barrel Reserve — 회원이 5L~40L 프리미엄 오크통을 직접 분양받아 자신만의 원주를 숙성시키고, 숙성 기간과 블렌드마스터 평가 점수에 따라 자산 가치가 함께 성장하는 개인 배럴 소유 시스템. 리터당 EXP 또는 ZP로 분양 신청 가능하며 회원간 P2P 거래도 가능함.',
    ctaVi: 'Khám phá Barrel Reserve',
    href: '/rewards/barrel-reserve',
    imageQuery: 'oak barrel aging cellar premium',
  },
  {
    id: 'ztro_exchange',
    topicKo:
      'ZTRO 토큰 스테이킹 및 EXP/ZP 포인트 교환 시스템 — 회원이 ZTRO 토큰을 예치(스테이킹)하면 혜택을 받고, EXP/ZP 포인트를 서로 교환하거나 쇼핑에 사용할 수 있는 ZenTaro의 리워드 경제 시스템.',
    ctaVi: 'Khám phá ZTRO Exchange',
    href: '/exchange',
    imageQuery: 'digital token finance abstract gold',
  },
  {
    id: 'bottle_cap',
    topicKo:
      'Bottle Cap Rewards — ZenTaro 제품 병뚜껑 안쪽 QR코드를 스캔해서 추첨에 참여하고 EXP/ZP 등 다양한 리워드에 당첨될 수 있는 병뚜껑 리워드 프로그램.',
    ctaVi: 'Tham gia Bottle Cap Rewards',
    href: '/rewards/bottle-cap',
    imageQuery: 'bottle cap prize lottery reward',
  },
  {
    id: 'contribution',
    topicKo:
      'Contribution Rewards — 다 마신 술병이나 오크통 등을 회수하면 검수 후 쇼핑머니(ZP/EXP)를 지급하는 자원순환형 기여 리워드 프로그램.',
    ctaVi: 'Tìm hiểu Contribution Rewards',
    href: '/rewards/contribution',
    imageQuery: 'recycling sustainability bottle collection',
  },
  {
    id: 'mall',
    topicKo:
      'ZENTARO Mall — 회원이 적립한 ZP(리워드 포인트)로 프리미엄 증류주와 굿즈를 구매할 수 있는 ZenTaro 공식 쇼핑몰.',
    ctaVi: 'Mua sắm tại ZENTARO Mall',
    href: '/mall',
    imageQuery: 'luxury liquor bottle shelf boutique',
  },
];

@Injectable()
export class AiWriterService {
  private readonly logger = new Logger(AiWriterService.name);
  private readonly anthropic: Anthropic | null;
  private readonly geminiApiKey: string | null;
  private readonly pexelsApiKey: string | null;
  private tagCursor = 0;
  private promoCursor = 0;

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

  private nextPromoTopic(): SystemPromoTopic {
    const topic = SYSTEM_PROMO_TOPICS[this.promoCursor % SYSTEM_PROMO_TOPICS.length];
    this.promoCursor += 1;
    return topic;
  }

  // Once a day, one article per category (6 tags = 6 posts/day).
  @Cron('0 9 * * *')
  async handleCron() {
    for (const tag of AI_TAGS) {
      await this.generateOne(tag);
    }
  }

  // Every 6 hours, one ZenTaro system-promo "card news" post (rotates through
  // Barrel Reserve, ZTRO Exchange, Bottle Cap, Contribution, Mall) — 4 posts/day.
  @Cron('0 */6 * * *')
  async handleSystemPromoCron() {
    await this.generateSystemPromoOne();
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
"${chosenTag}"를 주제로, ZENTARO Mall(쇼핑몰) 방문객이 흥미롭게 읽을 만한 베트남어(Tiếng Việt) 웹진 아티클을 한 편 작성하세요.
제목과 본문 모두 반드시 베트남어로 작성하세요 (한국어 금지).

요구사항:
- 실제 존재하지 않는 특정 최신 사건/통계/인물을 사실인 것처럼 단정하지 말고, 일반적인 지식·트렌드·팁·페어링 아이디어 중심으로 작성
- 분량: 600~900자 내외의 본문
- 형식: 소제목(h3), 문단(p), 필요시 목록(ul/li)을 사용한 HTML 조각 (html/head/body 태그 없이 본문 내용만)
- 어조: 고급스럽고 신뢰감 있는 매거진 톤

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이, title과 contentHtml 모두 베트남어):
{"title": "Tiêu đề bài viết (Tiếng Việt)", "contentHtml": "<h3>...</h3><p>...</p>"}`;

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

    const imageUrl = await this.fetchFreeImage(IMAGE_QUERY_BY_TAG[chosenTag] ?? 'craft spirits bar');
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

  /**
   * Generates a Vietnamese "card news" style webzine post promoting one of ZenTaro's own
   * reward/commerce systems (Barrel Reserve, ZTRO Exchange, Bottle Cap, Contribution, Mall).
   * The AI only writes the card copy; the CTA button linking to the real feature page is
   * appended afterward so the link is never hallucinated.
   */
  async generateSystemPromoOne(topicId?: string) {
    if (!this.geminiApiKey && !this.anthropic) {
      this.logger.warn(
        'Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY set — skipping system-promo card news generation.',
      );
      return null;
    }

    const topic = (topicId && SYSTEM_PROMO_TOPICS.find((t) => t.id === topicId)) || this.nextPromoTopic();

    const prompt = `당신은 프리미엄 크래프트 증류소 브랜드 "ZENTARO"의 마케팅 에디터입니다.
아래 ZenTaro 자체 시스템/기능을 홍보하는 "카드뉴스" 스타일의 베트남어(Tiếng Việt) 웹진 게시글을 작성하세요.
제목과 본문 모두 반드시 베트남어로 작성하세요 (한국어 금지).

홍보 대상 시스템: ${topic.topicKo}

요구사항:
- 카드뉴스 형식: 짧고 강렬한 카드 4~5개로 구성. 각 카드는 아래 HTML 템플릿을 그대로 사용하고 텍스트만 채우세요 (스타일 속성은 절대 변경하지 말 것):
  <div style="border:1px solid rgba(201,162,75,0.35);border-radius:12px;padding:16px 18px;margin-bottom:14px;background:rgba(201,162,75,0.06);"><div style="font-size:12px;color:#c9a24b;font-weight:700;letter-spacing:0.05em;margin-bottom:6px;">01</div><h4 style="margin:0 0 6px;font-size:16px;font-weight:600;">Tiêu đề ngắn</h4><p style="margin:0;font-size:14px;line-height:1.6;">Mô tả ngắn gọn 1~2 câu, tập trung vào lợi ích cho hội viên.</p></div>
  (카드 번호는 01, 02, 03... 순서대로)
- 첫 카드는 이 시스템이 무엇인지 한 줄로 소개, 이후 카드들은 핵심 혜택이나 작동 방식을 하나씩 소개
- 과장되거나 확인 불가능한 수치(예: "500% 수익 보장")는 사용하지 말 것
- 어조: 신뢰감 있고 세련되지만 과장 광고처럼 느껴지지 않게

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이, title과 contentHtml 모두 베트남어, contentHtml은 카드 div들만 이어붙인 것):
{"title": "Tiêu đề bài viết (Tiếng Việt)", "contentHtml": "<div style=...>...</div><div style=...>...</div>"}`;

    const rawText = this.geminiApiKey
      ? await this.callGemini(prompt)
      : await this.callAnthropic(prompt);

    if (!rawText) {
      this.logger.error('AI writer: no text content in system-promo response');
      return null;
    }

    let parsed: { title: string; contentHtml: string };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      this.logger.error('AI writer: failed to parse JSON response for system-promo');
      return null;
    }

    const imageUrl = await this.fetchFreeImage(topic.imageQuery);
    const ctaHtml = `<div style="margin-top:18px;text-align:center;"><a href="${topic.href}" style="display:inline-block;background:#c9a24b;color:#111;font-weight:700;font-size:14px;padding:10px 24px;border-radius:999px;text-decoration:none;">${topic.ctaVi} →</a></div>`;
    const contentHtml =
      (imageUrl
        ? `<img src="${imageUrl}" alt="${parsed.title}" style="width:100%;border-radius:12px;margin-bottom:1.5rem;" />`
        : '') +
      parsed.contentHtml +
      ctaHtml;

    const result = await this.postsService.create(
      {
        title: parsed.title,
        contentHtml,
        tags: [SYSTEM_PROMO_TAG],
      },
      'ai',
      'ZENTARO AI',
    );
    this.logger.log(`AI system-promo card news created: "${parsed.title}" (${topic.id})`);

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

  // Never reuse an image already used on a past post — retries across
  // several random pages and gives up (no image) rather than repeat one.
  private async fetchFreeImage(query: string): Promise<string | null> {
    if (!this.pexelsApiKey) return null;
    const usedUrls = await this.postsService.getUsedImageUrls();
    const triedPages = new Set<number>();

    for (let attempt = 0; attempt < 5; attempt++) {
      let page: number;
      do {
        page = 1 + Math.floor(Math.random() * 20);
      } while (triedPages.has(page) && triedPages.size < 20);
      triedPages.add(page);

      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
          { headers: { Authorization: this.pexelsApiKey } },
        );
        if (!res.ok) {
          this.logger.warn(`Pexels API error (${res.status}) for query "${query}"`);
          continue;
        }
        const body = await res.json();
        const photos: Array<{ src?: { large?: string } }> = body?.photos ?? [];
        const candidates = photos
          .map((p) => p.src?.large)
          .filter((u): u is string => typeof u === 'string');
        const unused = candidates.filter((u) => !usedUrls.has(u));
        if (unused.length > 0) {
          return unused[Math.floor(Math.random() * unused.length)];
        }
      } catch (err) {
        this.logger.warn(`Pexels fetch failed for query "${query}": ${err}`);
      }
    }

    this.logger.warn(`No unused Pexels image found for query "${query}" after retries — posting without an image.`);
    return null;
  }

  async generateBarrelTastingComment(input: {
    capacityLiters: number;
    charLevel: string;
    agingEnvironment: string;
    agingMonths: number;
    totalScore: number;
    grade: string;
    breakdown?: { aroma: number; palate: number; finish: number; barrelQuality: number } | null;
  }): Promise<string | null> {
    if (!this.geminiApiKey && !this.anthropic) return null;

    const breakdownText = input.breakdown
      ? `Điểm chi tiết: Hương thơm (Aroma) ${input.breakdown.aroma}/200, Vị (Palate) ${input.breakdown.palate}/180, Hậu vị (Finish) ${input.breakdown.finish}/70, Chất lượng thùng (Barrel Quality) ${input.breakdown.barrelQuality}/50.`
      : '';

    const prompt = `Bạn là Blend Master của ZENTARO Distillery, đang viết một nhận xét thử rượu (tasting note) ngắn gọn bằng tiếng Việt cho một thùng rượu đang được ủ riêng cho một hội viên.

Thông tin thùng:
- Dung tích: ${input.capacityLiters}L
- Char Level: ${input.charLevel}
- Môi trường ủ: ${input.agingEnvironment}
- Thời gian đã ủ: khoảng ${input.agingMonths} tháng
- Tổng điểm đánh giá của Blend Master: ${input.totalScore}/500
- Hạng: ${input.grade}
${breakdownText}

Viết 2-3 câu nhận xét chuyên nghiệp, tự nhiên, đúng phong cách một Master Blender giàu kinh nghiệm, phản ánh đúng mức độ điểm số và hạng ở trên (điểm càng cao thì nhận xét càng ấn tượng, điểm thấp thì nhận xét nên trung thực nhưng vẫn mang tính xây dựng). Chỉ trả lời bằng đoạn văn nhận xét bằng tiếng Việt, không thêm tiêu đề, không thêm giải thích nào khác, không dùng dấu ngoặc kép bao quanh.`;

    const rawText = this.geminiApiKey
      ? await this.callGemini(prompt)
      : await this.callAnthropic(prompt);

    return rawText?.trim() || null;
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
