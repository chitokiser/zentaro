import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { GenerateCocktailDto } from './dto/generate-cocktail.dto';

const GEMINI_MODEL = 'gemini-2.5-flash';

export interface AiCocktailRecipe {
  name: string;
  tagline: string;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  glassware: string;
  garnish: string | null;
}

const LOCALE_NAMES: Record<string, string> = {
  ko: '한국어',
  vi: 'Tiếng Việt',
  en: 'English',
};

/**
 * Generates an ORIGINAL cocktail recipe combining a real ZENTARO product with
 * common real-world ingredients — not a lookup against TheCocktailDB (which has
 * no soju/rice-spirit entries at all, see drinks.controller.ts's cocktail
 * matching for the real-data-only version of this feature). The prompt
 * explicitly forbids claiming the result is an existing/published cocktail,
 * same "don't assert non-existent facts" discipline used in ai-writer.service.ts.
 */
@Injectable()
export class AiCocktailService {
  private readonly logger = new Logger(AiCocktailService.name);
  private readonly anthropic: Anthropic | null;
  private readonly geminiApiKey: string | null;

  constructor(private readonly config: ConfigService) {
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = anthropicKey
      ? new Anthropic({ apiKey: anthropicKey })
      : null;
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || null;
  }

  async generateRecipe(
    input: GenerateCocktailDto,
  ): Promise<AiCocktailRecipe | null> {
    if (!this.geminiApiKey && !this.anthropic) {
      this.logger.warn(
        'Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY set — skipping cocktail generation.',
      );
      return null;
    }

    const languageName = LOCALE_NAMES[input.locale] ?? 'English';
    const prompt = `You are a professional mixologist creating a brand-new, ORIGINAL cocktail recipe. This is NOT a search for an existing published cocktail — never claim or imply this recipe already exists, is a "classic", or is a known drink. It is a fresh creative suggestion.

Base spirit: "${input.productName}" (${input.productCategory}${input.abv ? `, ${input.abv} ABV` : ''})
Spirit description: ${input.productDescription}
${input.flavorHint ? `User's request: ${input.flavorHint}` : 'No specific flavor request — design a signature cocktail that suits this spirit well.'}

Respond in ${languageName}, in this exact JSON shape only, no other text, no markdown fences:
{"name": "cocktail name", "tagline": "one evocative sentence", "ingredients": [{"name": "ingredient", "amount": "quantity"}], "instructions": ["step 1", "step 2"], "glassware": "glass type", "garnish": "garnish or null"}`;

    const rawText = this.geminiApiKey
      ? await this.callGemini(prompt)
      : await this.callAnthropic(prompt);
    if (!rawText) return null;

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      return parsed as AiCocktailRecipe;
    } catch {
      this.logger.error('AI cocktail: failed to parse JSON response');
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
    const body: any = await res.json();
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
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = message.content.find((block) => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : null;
  }
}
