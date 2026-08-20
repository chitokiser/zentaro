import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { AROMA_AXES, TASTE_AXES, type AromaAxis, type TasteAxis } from './dto/botanical-scores.dto';
import type { UpsertBotanicalDto } from './dto/upsert-botanical.dto';
import type { UpsertProjectDto } from './dto/upsert-project.dto';

const GEMINI_MODEL = 'gemini-2.5-flash';

const LOCALE_NAMES: Record<string, string> = {
  ko: '한국어',
  vi: 'Tiếng Việt',
  en: 'English',
};

export interface FlavorLabBotanical extends Omit<UpsertBotanicalDto, never> {
  id: string;
}

export interface FlavorLabProject extends Omit<UpsertProjectDto, never> {
  id: string;
}

export interface FlavorDna {
  aroma: Record<AromaAxis, number>;
  taste: Record<TasteAxis, number>;
  mouthfeel: { light: number; body: number; warmth: number; smoothness: number; dryness: number };
  finish: { short: number; medium: number; long: number; dry: number; sweet: number; spicy: number };
}

export interface FlavorLabNarrative {
  nose: string;
  attack: string;
  midPalate: string;
  finish: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
}

export interface AnalyzeResult {
  project: FlavorLabProject;
  botanicals: (FlavorLabBotanical & { doseGrams: number })[];
  flavorDna: FlavorDna;
  narrative: FlavorLabNarrative | null;
}

// Volatile aromatics carry over well when steam-driven (distillation); heavy /
// bound compounds carry over better with a long soak (maceration) instead.
const VOLATILE_AXES = new Set<AromaAxis | TasteAxis>(['floral', 'fruity', 'citrus', 'herbal', 'spicy', 'vanilla']);
const HEAVY_AXES = new Set<AromaAxis | TasteAxis>(['woody', 'earthy', 'roasted', 'bitter', 'astringency', 'umami', 'salty']);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * ZENTARO AI Virtual Research Lab — predicts the Flavor DNA of an R&D recipe
 * (base spirit + dosed botanicals + extraction conditions) BEFORE distillation.
 *
 * "Database First, AI Second": the numeric Flavor DNA is always computed
 * deterministically from the Botanical DB + recipe dose/extraction inputs
 * (computeFlavorDna). The LLM never invents scores — it only receives the
 * already-computed numbers and writes a tasting-note narrative consistent
 * with them. If no AI key is configured or the call fails, analyze() still
 * returns the deterministic Flavor DNA with narrative: null.
 */
@Injectable()
export class FlavorLabService {
  private readonly logger = new Logger(FlavorLabService.name);
  private readonly anthropic: Anthropic | null;
  private readonly geminiApiKey: string | null;

  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly config: ConfigService,
  ) {
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || null;
  }

  private botanicalsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_FLAVOR_LAB_BOTANICALS);
  }

  private projectsCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_FLAVOR_LAB_PROJECTS);
  }

  // ---------- Botanicals ----------

  async listBotanicals(): Promise<FlavorLabBotanical[]> {
    const snap = await this.botanicalsCol().get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FlavorLabBotanical);
  }

  async getBotanicalsByIds(ids: string[]): Promise<Map<string, FlavorLabBotanical>> {
    const uniqueIds = [...new Set(ids)];
    const docs = await Promise.all(uniqueIds.map((id) => this.botanicalsCol().doc(id).get()));
    const map = new Map<string, FlavorLabBotanical>();
    docs.forEach((doc) => {
      if (doc.exists) map.set(doc.id, { id: doc.id, ...doc.data() } as FlavorLabBotanical);
    });
    return map;
  }

  async upsertBotanical(slug: string, dto: UpsertBotanicalDto): Promise<FlavorLabBotanical> {
    await this.botanicalsCol()
      .doc(slug)
      .set({ ...dto, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { id: slug, ...dto };
  }

  async removeBotanical(slug: string): Promise<{ id: string }> {
    await this.botanicalsCol().doc(slug).delete();
    return { id: slug };
  }

  // ---------- Projects ----------

  async listProjects(): Promise<FlavorLabProject[]> {
    const snap = await this.projectsCol().get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FlavorLabProject);
  }

  async getProject(id: string): Promise<FlavorLabProject> {
    const snap = await this.projectsCol().doc(id).get();
    if (!snap.exists) throw new NotFoundException('R&D project not found');
    return { id: snap.id, ...snap.data() } as FlavorLabProject;
  }

  async createProject(dto: UpsertProjectDto): Promise<FlavorLabProject> {
    const docRef = await this.projectsCol().add({
      ...dto,
      version: dto.version ?? 'v1.0',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, ...dto, version: dto.version ?? 'v1.0' };
  }

  async updateProject(id: string, dto: UpsertProjectDto): Promise<FlavorLabProject> {
    const ref = this.projectsCol().doc(id);
    if (!(await ref.get()).exists) throw new NotFoundException('R&D project not found');
    await ref.update({ ...dto, updatedAt: FieldValue.serverTimestamp() });
    return { id, ...dto };
  }

  async removeProject(id: string): Promise<{ id: string }> {
    await this.projectsCol().doc(id).delete();
    return { id };
  }

  /** Upserts with an explicit doc id — used by the seed script so project ids stay stable across reseeds. */
  async upsertProjectWithId(id: string, dto: UpsertProjectDto): Promise<FlavorLabProject> {
    await this.projectsCol()
      .doc(id)
      .set({ ...dto, version: dto.version ?? 'v1.0', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { id, ...dto, version: dto.version ?? 'v1.0' };
  }

  // ---------- Analyze ----------

  async analyze(projectId: string, locale: 'ko' | 'en' | 'vi' = 'ko'): Promise<AnalyzeResult> {
    const project = await this.getProject(projectId);
    const botanicalMap = await this.getBotanicalsByIds(project.botanicals.map((b) => b.botanicalId));
    const botanicals = project.botanicals
      .filter((b) => botanicalMap.has(b.botanicalId))
      .map((b) => ({ ...(botanicalMap.get(b.botanicalId) as FlavorLabBotanical), doseGrams: b.doseGrams }));

    const flavorDna = this.computeFlavorDna(project, botanicals);
    const narrative = await this.generateNarrative(project, botanicals, flavorDna, locale);

    return { project, botanicals, flavorDna, narrative };
  }

  private computeFlavorDna(
    project: FlavorLabProject,
    botanicals: (FlavorLabBotanical & { doseGrams: number })[],
  ): FlavorDna {
    const totalDose = botanicals.reduce((sum, b) => sum + b.doseGrams, 0) || 1;
    const gramsPerLiter = (totalDose / project.baseVolumeMl) * 1000;
    // Heuristic: a typical R&D infusion sits around 2-4 g/L; scale intensity
    // around that band rather than letting it grow unbounded.
    const concentrationFactor = clamp(0.75 + gramsPerLiter * 0.06, 0.7, 1.4);

    const method = project.extractionMethod.toLowerCase();
    const isDistillation = method.includes('distill');
    const isMaceration = method.includes('macer');
    const timeFactor = clamp(project.extractionTimeHours / 24, 0.15, 1);
    const highHeat = project.extractionTemperatureC > 60;

    const weightedAxis = (axis: AromaAxis | TasteAxis): number => {
      const raw = botanicals.reduce(
        (sum, b) => sum + (b.scores[axis] ?? 0) * (b.doseGrams / totalDose),
        0,
      );

      let extractionMult = 1;
      if (isDistillation) {
        extractionMult = VOLATILE_AXES.has(axis) ? 1.1 : 0.75;
      } else if (isMaceration) {
        extractionMult = HEAVY_AXES.has(axis) ? 1 + 0.25 * timeFactor : 0.85 + 0.15 * timeFactor;
      } else {
        extractionMult = 0.9 + 0.1 * timeFactor;
      }

      let temperatureAdjust = 1;
      if (highHeat && ['floral', 'citrus', 'fruity'].includes(axis)) temperatureAdjust = 0.9;
      if (highHeat && ['bitter', 'astringency', 'earthy', 'woody'].includes(axis)) temperatureAdjust = 1.1;

      return clamp(raw * extractionMult * temperatureAdjust * concentrationFactor);
    };

    const aroma = Object.fromEntries(AROMA_AXES.map((axis) => [axis, weightedAxis(axis)])) as Record<
      AromaAxis,
      number
    >;
    const taste = Object.fromEntries(TASTE_AXES.map((axis) => [axis, weightedAxis(axis)])) as Record<
      TasteAxis,
      number
    >;

    const bodyRaw = botanicals.reduce((sum, b) => sum + b.scores.body * (b.doseGrams / totalDose), 0);
    const drynessRaw = botanicals.reduce((sum, b) => sum + b.scores.dryness * (b.doseGrams / totalDose), 0);
    const finishRaw = botanicals.reduce((sum, b) => sum + b.scores.finish * (b.doseGrams / totalDose), 0);
    const aromaIntensityAvg = botanicals.reduce(
      (sum, b) => sum + b.aromaIntensity * (b.doseGrams / totalDose),
      0,
    );
    const flavorIntensityAvg = botanicals.reduce(
      (sum, b) => sum + b.flavorIntensity * (b.doseGrams / totalDose),
      0,
    );

    const warmth = clamp(project.targetAbv * 1.4);
    const body = clamp(bodyRaw * concentrationFactor);
    const light = clamp(100 - body);
    const dryness = clamp(drynessRaw * 0.7 + taste.astringency * 0.2 + taste.sour * 0.1);
    const smoothness = clamp(100 - (taste.astringency * 0.4 + taste.bitter * 0.3 + Math.max(0, project.targetAbv - 40) * 0.5));

    const lengthScore = clamp((finishRaw * 0.5 + aromaIntensityAvg * 0.25 + flavorIntensityAvg * 0.25) * concentrationFactor);
    const long = lengthScore;
    const short = clamp(100 - lengthScore);
    const medium = clamp(100 - Math.abs(lengthScore - 50) * 2);
    const finishDry = clamp(taste.astringency * 0.5 + dryness * 0.5);
    const finishSweet = taste.sweet;
    const finishSpicy = aroma.spicy;

    return {
      aroma,
      taste,
      mouthfeel: { light, body, warmth, smoothness, dryness },
      finish: { short, medium, long, dry: finishDry, sweet: finishSweet, spicy: finishSpicy },
    };
  }

  private async generateNarrative(
    project: FlavorLabProject,
    botanicals: (FlavorLabBotanical & { doseGrams: number })[],
    flavorDna: FlavorDna,
    locale: 'ko' | 'en' | 'vi',
  ): Promise<FlavorLabNarrative | null> {
    if (!this.geminiApiKey && !this.anthropic) {
      this.logger.warn('Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY set — skipping flavor narrative.');
      return null;
    }

    const languageName = LOCALE_NAMES[locale] ?? '한국어';
    const botanicalLines = botanicals
      .map((b) => `- ${b.name} (${b.doseGrams}g): top=${b.topAroma.join('/')}, mid=${b.midAroma.join('/')}, base=${b.baseAroma.join('/')}`)
      .join('\n');

    const prompt = `You are a spirits R&D flavor analyst for ZENTARO distillery. You are given ALREADY-COMPUTED, deterministic flavor scores (0-100) for an experimental recipe — these numbers come from a botanical database and a fixed formula, not from you. Do NOT invent or contradict any numeric score. Your only job is to write a natural-language tasting-note narrative and a short research note that are consistent with the given numbers.

This is a PRE-PRODUCTION SIMULATION — nothing has actually been distilled or tasted yet. Every sentence must read as a prediction/estimate, never as a claim of measured fact.

Recipe: "${project.projectName}"
Base spirit: ${project.baseSpirit}, ${project.baseAbv}% ABV → target ${project.targetAbv}% ABV
Extraction: ${project.extractionMethod}, ${project.extractionTimeHours}h at ${project.extractionTemperatureC}°C
Botanicals:
${botanicalLines}

Computed Flavor DNA (0-100 scale):
Aroma: ${JSON.stringify(flavorDna.aroma)}
Taste: ${JSON.stringify(flavorDna.taste)}
Mouthfeel: ${JSON.stringify(flavorDna.mouthfeel)}
Finish: ${JSON.stringify(flavorDna.finish)}

Respond in ${languageName}, in this exact JSON shape only, no other text, no markdown fences:
{"nose": "1 sentence describing predicted aroma", "attack": "1 sentence describing predicted first taste", "midPalate": "1 sentence describing predicted mid-palate development", "finish": "1 sentence describing predicted finish", "strengths": ["short phrase", "short phrase"], "risks": ["short phrase", "short phrase"], "recommendation": "1 sentence of R&D advice"}`;

    let rawText = this.geminiApiKey ? await this.callGemini(prompt) : null;
    if (!rawText && this.anthropic) {
      rawText = await this.callAnthropic(prompt);
    }
    if (!rawText) return null;

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed: unknown = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      return parsed as FlavorLabNarrative;
    } catch {
      this.logger.error('Flavor lab: failed to parse AI narrative JSON response');
      return null;
    }
  }

  private async callGemini(prompt: string): Promise<string | null> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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
