import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
import { PostsService } from '../posts/posts.service';
import { WEBZINE_TAGS } from '../common/webzine-tags';

@Injectable()
export class AiWriterService {
  private readonly logger = new Logger(AiWriterService.name);
  private readonly anthropic: Anthropic | null;
  private tagCursor = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly postsService: PostsService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  private nextTag(): string {
    const tag = WEBZINE_TAGS[this.tagCursor % WEBZINE_TAGS.length];
    this.tagCursor += 1;
    return tag;
  }

  // Every 2 hours (00:00, 02:00, 04:00, ... 22:00) — 12 posts/day.
  @Cron('0 */2 * * *')
  async handleCron() {
    await this.generateOne();
  }

  async generateOne(tag?: string) {
    if (!this.anthropic) {
      this.logger.warn('ANTHROPIC_API_KEY not set — skipping AI webzine post generation.');
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

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      this.logger.error('AI writer: no text content in response');
      return null;
    }

    let parsed: { title: string; contentHtml: string };
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      this.logger.error('AI writer: failed to parse JSON response');
      return null;
    }

    const result = await this.postsService.create(
      {
        title: parsed.title,
        contentHtml: parsed.contentHtml,
        tags: [chosenTag],
      },
      'ai',
      'ZENTARO AI',
    );
    this.logger.log(`AI webzine post created: "${parsed.title}" (${chosenTag})`);
    return result;
  }
}
