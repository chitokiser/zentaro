import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FlavorLabService } from '../flavor-lab/flavor-lab.service';
import type { UpsertBotanicalDto } from '../flavor-lab/dto/upsert-botanical.dto';
import type { UpsertProjectDto } from '../flavor-lab/dto/upsert-project.dto';

/**
 * Seeds the AI Virtual Research Lab's Botanical DB (extended flavor-score
 * schema, distinct from the marketing-facing frontend Botanical Archive) and
 * a handful of real R&D projects. Idempotent — upserts by fixed slug/id, so
 * it's safe to re-run after editing the data below.
 */

const BOTANICALS: Record<string, UpsertBotanicalDto> = {
  hibiscus: {
    name: 'Hibiscus', localName: '히비스커스', origin: 'Egypt / Sudan', plantPart: 'Flower',
    topAroma: ['Floral', 'Tart'], midAroma: ['Red berry'], baseAroma: ['Herbal'],
    scores: { floral: 55, fruity: 35, citrus: 15, herbal: 10, spicy: 0, woody: 5, earthy: 15, vanilla: 0, roasted: 0, sweet: 15, sour: 70, bitter: 15, umami: 0, salty: 0, astringency: 55, body: 20, dryness: 60, finish: 55 },
    colorEffect: 'Ruby red tint', aromaIntensity: 70, flavorIntensity: 75,
    recommendedDoseMin: 0.3, recommendedDoseMax: 1.2, recommendedAbv: 25,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 24, extractionTemperatureC: 20,
    distillationBehavior: 'Color and acidity are heat-sensitive — cold-macerate only, do not distil.',
    notes: 'Primary color and acidity driver for Ruby-style recipes; overdosing sharply raises astringency.',
  },
  lemongrass: {
    name: 'Lemongrass', localName: '레몬그라스', origin: 'Southeast Asia', plantPart: 'Stalk',
    topAroma: ['Citrus'], midAroma: ['Earthy'], baseAroma: ['Faint spice'],
    scores: { floral: 5, fruity: 10, citrus: 85, herbal: 35, spicy: 15, woody: 10, earthy: 20, vanilla: 0, roasted: 0, sweet: 10, sour: 20, bitter: 5, umami: 0, salty: 0, astringency: 10, body: 10, dryness: 30, finish: 45 },
    colorEffect: 'None', aromaIntensity: 80, flavorIntensity: 55,
    recommendedDoseMin: 0.2, recommendedDoseMax: 0.8, recommendedAbv: 40,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 1, extractionTemperatureC: 78,
    distillationBehavior: 'Highly volatile — carries through distillation cleanly via vapor infusion.',
    notes: 'Bright top-note citrus; easily overpowers softer florals, use as an accent.',
  },
  'coriander-seed': {
    name: 'Coriander Seed', localName: '고수씨', origin: 'Morocco', plantPart: 'Seed',
    topAroma: ['Lemon peel'], midAroma: ['Sage', 'Nutty'], baseAroma: ['Light spice'],
    scores: { floral: 10, fruity: 10, citrus: 55, herbal: 25, spicy: 20, woody: 5, earthy: 15, vanilla: 0, roasted: 5, sweet: 10, sour: 15, bitter: 10, umami: 0, salty: 0, astringency: 5, body: 15, dryness: 35, finish: 40 },
    colorEffect: 'None', aromaIntensity: 55, flavorIntensity: 45,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.3, recommendedAbv: 43,
    extractionMethod: 'Vacuum Distillation', extractionTimeHours: 2, extractionTemperatureC: 40,
    distillationBehavior: 'Low-boiling citrus oils preserved well under vacuum distillation.',
    notes: 'Classic gin backbone note; balances heavier florals with a citrus lift.',
  },
  'licorice-root': {
    name: 'Licorice Root', localName: '감초', origin: 'Uzbekistan', plantPart: 'Root',
    topAroma: ['Faint anise'], midAroma: ['Sweet root'], baseAroma: ['Deep sweet'],
    scores: { floral: 0, fruity: 0, citrus: 0, herbal: 20, spicy: 20, woody: 10, earthy: 35, vanilla: 10, roasted: 5, sweet: 85, sour: 0, bitter: 10, umami: 5, salty: 0, astringency: 5, body: 45, dryness: 10, finish: 70 },
    colorEffect: 'Amber tint', aromaIntensity: 35, flavorIntensity: 70,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.2, recommendedAbv: 40,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 6, extractionTemperatureC: 85,
    distillationBehavior: 'Non-volatile sweetness — long hot maceration or post-distillation infusion.',
    notes: 'Extremely potent natural sweetener — a little goes a long way.',
  },
  elderflower: {
    name: 'Elderflower', localName: '엘더플라워', origin: 'Europe', plantPart: 'Flower',
    topAroma: ['Lychee', 'Pear'], midAroma: ['Honey'], baseAroma: ['Faint grassy'],
    scores: { floral: 80, fruity: 45, citrus: 20, herbal: 10, spicy: 0, woody: 0, earthy: 10, vanilla: 5, roasted: 0, sweet: 45, sour: 10, bitter: 5, umami: 0, salty: 0, astringency: 5, body: 15, dryness: 15, finish: 50 },
    colorEffect: 'Pale gold', aromaIntensity: 75, flavorIntensity: 55,
    recommendedDoseMin: 0.3, recommendedDoseMax: 1.0, recommendedAbv: 30,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 48, extractionTemperatureC: 18,
    distillationBehavior: 'Delicate florals degrade under heat — cold macerate only.',
    notes: 'Tropical-leaning floral sweetness; pairs well with citrus peels — the closest botanical stand-in for a pear-like impression.',
  },
  'vanilla-bean': {
    name: 'Vanilla Bean', localName: '바닐라빈', origin: 'Madagascar', plantPart: 'Pod',
    topAroma: ['Creamy'], midAroma: ['Sweet woody'], baseAroma: ['Deep sweet'],
    scores: { floral: 5, fruity: 0, citrus: 0, herbal: 0, spicy: 5, woody: 15, earthy: 10, vanilla: 95, roasted: 15, sweet: 80, sour: 0, bitter: 5, umami: 5, salty: 0, astringency: 0, body: 55, dryness: 5, finish: 80 },
    colorEffect: 'Deep amber', aromaIntensity: 60, flavorIntensity: 75,
    recommendedDoseMin: 0.1, recommendedDoseMax: 0.4, recommendedAbv: 40,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 336, extractionTemperatureC: 20,
    distillationBehavior: 'Non-volatile — never distil, long cold-macerate or post-blend only.',
    notes: 'Rounds out sharp botanicals and significantly extends finish length.',
  },
  chamomile: {
    name: 'Chamomile', localName: '카모마일', origin: 'Egypt', plantPart: 'Flower',
    topAroma: ['Apple'], midAroma: ['Hay'], baseAroma: ['Herbal'],
    scores: { floral: 65, fruity: 20, citrus: 5, herbal: 30, spicy: 0, woody: 0, earthy: 10, vanilla: 5, roasted: 0, sweet: 30, sour: 5, bitter: 15, umami: 0, salty: 0, astringency: 10, body: 15, dryness: 20, finish: 40 },
    colorEffect: 'Pale yellow', aromaIntensity: 55, flavorIntensity: 40,
    recommendedDoseMin: 0.2, recommendedDoseMax: 0.8, recommendedAbv: 30,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 12, extractionTemperatureC: 20,
    distillationBehavior: 'Moderate volatility — light steam infusion acceptable, avoid prolonged boiling.',
    notes: 'Soft apple-like floral note; useful for rounding fruity-leaning recipes.',
  },
  'angelica-root': {
    name: 'Angelica Root', localName: '안젤리카 루트', origin: 'Belgium', plantPart: 'Root',
    topAroma: ['Musky'], midAroma: ['Celery'], baseAroma: ['Rooty'],
    scores: { floral: 5, fruity: 0, citrus: 5, herbal: 25, spicy: 10, woody: 20, earthy: 75, vanilla: 0, roasted: 5, sweet: 5, sour: 0, bitter: 20, umami: 10, salty: 0, astringency: 15, body: 40, dryness: 45, finish: 60 },
    colorEffect: 'None', aromaIntensity: 45, flavorIntensity: 50,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.25, recommendedAbv: 43,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 48, extractionTemperatureC: 20,
    distillationBehavior: 'Acts as a fixative — binds other aromatics together, keep dose small and fixed.',
    notes: 'Fixative root — extends and anchors the aroma of every other botanical present.',
  },
  'juniper-berry': {
    name: 'Juniper Berry', localName: '주니퍼베리', origin: 'Italy', plantPart: 'Berry',
    topAroma: ['Pine'], midAroma: ['Resinous'], baseAroma: ['Woody'],
    scores: { floral: 5, fruity: 10, citrus: 10, herbal: 20, spicy: 10, woody: 35, earthy: 45, vanilla: 0, roasted: 0, sweet: 5, sour: 5, bitter: 20, umami: 0, salty: 0, astringency: 10, body: 30, dryness: 50, finish: 55 },
    colorEffect: 'None', aromaIntensity: 60, flavorIntensity: 55,
    recommendedDoseMin: 0.3, recommendedDoseMax: 1.5, recommendedAbv: 43,
    extractionMethod: 'Co-Distillation', extractionTimeHours: 3, extractionTemperatureC: 78,
    distillationBehavior: 'Defines gin character — co-distil with other botanicals for a fused aroma.',
    notes: 'The identity anchor of any gin-style recipe; dose strongly drives overall dryness.',
  },
  sage: {
    name: 'Sage', localName: '세이지', origin: 'Croatia', plantPart: 'Leaf',
    topAroma: ['Eucalyptus'], midAroma: ['Camphor'], baseAroma: ['Woody'],
    scores: { floral: 5, fruity: 0, citrus: 0, herbal: 55, spicy: 15, woody: 15, earthy: 30, vanilla: 0, roasted: 0, sweet: 0, sour: 0, bitter: 25, umami: 5, salty: 0, astringency: 15, body: 20, dryness: 35, finish: 35 },
    colorEffect: 'None', aromaIntensity: 50, flavorIntensity: 40,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.2, recommendedAbv: 43,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 1, extractionTemperatureC: 78,
    distillationBehavior: 'Strong medicinal note if over-extracted — short vapor infusion only.',
    notes: 'Use sparingly — quickly turns medicinal/soapy past a short infusion window.',
  },
  rosemary: {
    name: 'Rosemary', localName: '로즈마리', origin: 'Spain', plantPart: 'Leaf',
    topAroma: ['Pine'], midAroma: ['Resinous'], baseAroma: ['Woody'],
    scores: { floral: 5, fruity: 0, citrus: 15, herbal: 55, spicy: 10, woody: 25, earthy: 30, vanilla: 0, roasted: 0, sweet: 0, sour: 0, bitter: 15, umami: 0, salty: 0, astringency: 10, body: 20, dryness: 30, finish: 35 },
    colorEffect: 'None', aromaIntensity: 55, flavorIntensity: 35,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.25, recommendedAbv: 43,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 1, extractionTemperatureC: 78,
    distillationBehavior: 'Pine-like volatility — short vapor infusion preserves freshness.',
    notes: 'Pairs well with juniper for a herbal-forward gin direction.',
  },
  thyme: {
    name: 'Thyme', localName: '타임', origin: 'France', plantPart: 'Leaf',
    topAroma: ['Earthy'], midAroma: ['Peppery'], baseAroma: ['Woody'],
    scores: { floral: 5, fruity: 0, citrus: 10, herbal: 50, spicy: 15, woody: 15, earthy: 35, vanilla: 0, roasted: 0, sweet: 0, sour: 0, bitter: 15, umami: 5, salty: 0, astringency: 10, body: 20, dryness: 30, finish: 35 },
    colorEffect: 'None', aromaIntensity: 55, flavorIntensity: 35,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.2, recommendedAbv: 43,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 1, extractionTemperatureC: 78,
    distillationBehavior: 'High thymol content — brief infusion only or aroma turns medicinal.',
    notes: 'Adds background herbal complexity without dominating.',
  },
  'orris-root': {
    name: 'Orris Root', localName: '오리스 루트', origin: 'Italy', plantPart: 'Root',
    topAroma: ['Violet'], midAroma: ['Powdery'], baseAroma: ['Woody'],
    scores: { floral: 60, fruity: 5, citrus: 0, herbal: 10, spicy: 0, woody: 20, earthy: 20, vanilla: 5, roasted: 0, sweet: 10, sour: 0, bitter: 5, umami: 0, salty: 0, astringency: 5, body: 25, dryness: 25, finish: 50 },
    colorEffect: 'None', aromaIntensity: 35, flavorIntensity: 30,
    recommendedDoseMin: 0.02, recommendedDoseMax: 0.08, recommendedAbv: 43,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 72, extractionTemperatureC: 20,
    distillationBehavior: 'Extremely potent fixative — use in tiny doses, extends aroma persistence.',
    notes: 'Fixative that smooths and lengthens the whole aroma profile; easy to overdose.',
  },
  'lemon-peel': {
    name: 'Lemon Peel', localName: '레몬 껍질', origin: 'Sicily', plantPart: 'Peel',
    topAroma: ['Zesty citrus'], midAroma: ['Waxy'], baseAroma: ['None'],
    scores: { floral: 5, fruity: 20, citrus: 95, herbal: 0, spicy: 0, woody: 0, earthy: 5, vanilla: 0, roasted: 0, sweet: 5, sour: 35, bitter: 10, umami: 0, salty: 0, astringency: 5, body: 5, dryness: 20, finish: 30 },
    colorEffect: 'None', aromaIntensity: 80, flavorIntensity: 50,
    recommendedDoseMin: 0.1, recommendedDoseMax: 0.5, recommendedAbv: 43,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 1, extractionTemperatureC: 78,
    distillationBehavior: 'Peel oils carry through distillation cleanly; avoid pith to prevent bitterness.',
    notes: 'Sharp, clean top-note lift; classic gin citrus.',
  },
  'bitter-orange-peel': {
    name: 'Bitter Orange Peel', localName: '비터 오렌지 껍질', origin: 'Seville', plantPart: 'Peel',
    topAroma: ['Marmalade'], midAroma: ['Floral'], baseAroma: ['Bitter'],
    scores: { floral: 15, fruity: 35, citrus: 85, herbal: 5, spicy: 5, woody: 0, earthy: 5, vanilla: 0, roasted: 0, sweet: 20, sour: 20, bitter: 30, umami: 0, salty: 0, astringency: 10, body: 10, dryness: 25, finish: 45 },
    colorEffect: 'Pale amber', aromaIntensity: 70, flavorIntensity: 55,
    recommendedDoseMin: 0.1, recommendedDoseMax: 0.4, recommendedAbv: 43,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 6, extractionTemperatureC: 70,
    distillationBehavior: 'Higher oil content than sweet orange — holds up well to heat.',
    notes: 'Adds citrus depth with a bittersweet edge, more robust than lemon peel.',
  },
  omija: {
    name: 'Omija (Five-Flavor Berry)', localName: '오미자', origin: 'Korea', plantPart: 'Berry',
    topAroma: ['Tart berry'], midAroma: ['Sweet-sour'], baseAroma: ['Faint spice'],
    scores: { floral: 10, fruity: 55, citrus: 20, herbal: 10, spicy: 15, woody: 5, earthy: 10, vanilla: 0, roasted: 0, sweet: 45, sour: 70, bitter: 35, umami: 5, salty: 10, astringency: 20, body: 30, dryness: 35, finish: 65 },
    colorEffect: 'Deep red tint', aromaIntensity: 55, flavorIntensity: 75,
    recommendedDoseMin: 0.3, recommendedDoseMax: 1.0, recommendedAbv: 35,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 48, extractionTemperatureC: 20,
    distillationBehavior: 'Complex multi-taste profile is heat-sensitive — cold macerate to preserve balance.',
    notes: 'Uniquely carries all five basic tastes at once — even a small dose reshapes the whole taste axis.',
  },
  'star-anise': {
    name: 'Star Anise', localName: '팔각', origin: 'Vietnam', plantPart: 'Fruit',
    topAroma: ['Sweet anise'], midAroma: ['Licorice-like'], baseAroma: ['Warm spice'],
    scores: { floral: 10, fruity: 0, citrus: 0, herbal: 10, spicy: 70, woody: 15, earthy: 20, vanilla: 0, roasted: 5, sweet: 55, sour: 0, bitter: 10, umami: 0, salty: 0, astringency: 5, body: 30, dryness: 20, finish: 60 },
    colorEffect: 'None', aromaIntensity: 65, flavorIntensity: 65,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.2, recommendedAbv: 40,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 24, extractionTemperatureC: 80,
    distillationBehavior: 'Robust anethole oils survive hot maceration and boiling well.',
    notes: 'Strong structural spice note — anchors oriental-spiced recipes.',
  },
  cinnamon: {
    name: 'Cinnamon', localName: '계피', origin: 'Vietnam', plantPart: 'Bark',
    topAroma: ['Warm bark'], midAroma: ['Sweet spice'], baseAroma: ['Dry woody'],
    scores: { floral: 0, fruity: 0, citrus: 0, herbal: 0, spicy: 80, woody: 35, earthy: 25, vanilla: 10, roasted: 10, sweet: 35, sour: 0, bitter: 15, umami: 0, salty: 0, astringency: 15, body: 35, dryness: 25, finish: 65 },
    colorEffect: 'Amber tint', aromaIntensity: 70, flavorIntensity: 70,
    recommendedDoseMin: 0.05, recommendedDoseMax: 0.2, recommendedAbv: 40,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 24, extractionTemperatureC: 80,
    distillationBehavior: 'Best extracted in the distillation tails; a late cutting risks bitterness.',
    notes: 'Heavy spice backbone — easily dominates if not carefully dosed.',
  },
  ginger: {
    name: 'Ginger', localName: '생강', origin: 'Korea', plantPart: 'Rhizome',
    topAroma: ['Zesty spice'], midAroma: ['Warm root'], baseAroma: ['Faint sweet'],
    scores: { floral: 0, fruity: 0, citrus: 10, herbal: 5, spicy: 75, woody: 0, earthy: 45, vanilla: 0, roasted: 0, sweet: 20, sour: 0, bitter: 10, umami: 0, salty: 0, astringency: 5, body: 20, dryness: 20, finish: 50 },
    colorEffect: 'Pale straw', aromaIntensity: 60, flavorIntensity: 65,
    recommendedDoseMin: 0.1, recommendedDoseMax: 0.4, recommendedAbv: 35,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 12, extractionTemperatureC: 70,
    distillationBehavior: 'Fresh root gives brighter heat than dried — adjust dose by the form used.',
    notes: 'Bright peppery heat that lifts otherwise heavy earthy blends.',
  },
  'butterfly-pea-flower': {
    name: 'Butterfly Pea Flower', localName: '나비콩꽃', origin: 'Vietnam', plantPart: 'Flower',
    topAroma: ['Neutral'], midAroma: ['Faint green'], baseAroma: ['None'],
    scores: { floral: 5, fruity: 0, citrus: 0, herbal: 5, spicy: 0, woody: 0, earthy: 5, vanilla: 0, roasted: 0, sweet: 0, sour: 0, bitter: 5, umami: 0, salty: 0, astringency: 0, body: 5, dryness: 5, finish: 10 },
    colorEffect: 'Vivid blue, shifts to violet/pink with acid', aromaIntensity: 10, flavorIntensity: 5,
    recommendedDoseMin: 0.1, recommendedDoseMax: 0.5, recommendedAbv: 40,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 12, extractionTemperatureC: 20,
    distillationBehavior: 'Non-volatile pigment — never distil, cold macerate briefly to avoid diluting color.',
    notes: 'Contributes almost no flavor — used purely for its pH-reactive blue-to-violet color shift.',
  },
};

// Product lineup as directed: ORIGIN / RUBY / SAPPHIRE / EMERALD / RICE WINE.
const RETIRED_PROJECT_IDS = ['zentaro-pear', 'zentaro-herb', 'zentaro-gin'];

const PROJECTS: Record<string, UpsertProjectDto> = {
  'zentaro-origin': {
    projectName: 'ZENTARO ORIGIN', accentColor: '#c08a2e',
    baseSpirit: 'Rice Spirit', baseAbv: 63, targetAbv: 30, baseVolumeMl: 1000,
    extractionMethod: 'Maceration & Boiling', extractionTimeHours: 24, extractionTemperatureC: 80,
    botanicals: [
      { botanicalId: 'omija', doseGrams: 0.6 },
      { botanicalId: 'star-anise', doseGrams: 0.1 },
      { botanicalId: 'cinnamon', doseGrams: 0.1 },
      { botanicalId: 'ginger', doseGrams: 0.15 },
    ],
    version: 'v1.0',
  },
  'zentaro-ruby': {
    projectName: 'ZENTARO RUBY', accentColor: '#9b1c3f',
    baseSpirit: 'Rice Spirit', baseAbv: 63, targetAbv: 25, baseVolumeMl: 1000,
    extractionMethod: 'Maceration → Distillation', extractionTimeHours: 24, extractionTemperatureC: 78,
    botanicals: [
      { botanicalId: 'hibiscus', doseGrams: 0.7 },
      { botanicalId: 'lemongrass', doseGrams: 0.4 },
      { botanicalId: 'coriander-seed', doseGrams: 0.08 },
      { botanicalId: 'licorice-root', doseGrams: 0.12 },
    ],
    version: 'v1.0',
  },
  'zentaro-sapphire': {
    projectName: 'ZENTARO SAPPHIRE', accentColor: '#1e5fa8',
    baseSpirit: 'Neutral Grain Spirit', baseAbv: 96, targetAbv: 40, baseVolumeMl: 1000,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 24, extractionTemperatureC: 20,
    botanicals: [
      { botanicalId: 'butterfly-pea-flower', doseGrams: 0.3 },
      { botanicalId: 'elderflower', doseGrams: 0.5 },
      { botanicalId: 'lemon-peel', doseGrams: 0.25 },
      { botanicalId: 'coriander-seed', doseGrams: 0.1 },
    ],
    version: 'v1.0',
  },
  'zentaro-emerald': {
    projectName: 'ZENTARO EMERALD', accentColor: '#0f6b3a',
    baseSpirit: 'Rice Spirit', baseAbv: 70, targetAbv: 38, baseVolumeMl: 1000,
    extractionMethod: 'Vapor Infusion', extractionTimeHours: 2, extractionTemperatureC: 78,
    botanicals: [
      { botanicalId: 'juniper-berry', doseGrams: 0.8 },
      { botanicalId: 'angelica-root', doseGrams: 0.1 },
      { botanicalId: 'coriander-seed', doseGrams: 0.1 },
      { botanicalId: 'sage', doseGrams: 0.08 },
      { botanicalId: 'rosemary', doseGrams: 0.08 },
      { botanicalId: 'thyme', doseGrams: 0.06 },
    ],
    version: 'v1.0',
  },
  'zentaro-ricewine': {
    projectName: 'ZENTARO RICE WINE', accentColor: '#d8c48a',
    baseSpirit: 'Rice Wine', baseAbv: 16, targetAbv: 14, baseVolumeMl: 1000,
    extractionMethod: 'Cold Maceration', extractionTimeHours: 24, extractionTemperatureC: 20,
    botanicals: [
      { botanicalId: 'chamomile', doseGrams: 0.3 },
      { botanicalId: 'omija', doseGrams: 0.15 },
      { botanicalId: 'vanilla-bean', doseGrams: 0.05 },
    ],
    version: 'v1.0',
  },
};

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const flavorLab = app.get(FlavorLabService);

  for (const [slug, dto] of Object.entries(BOTANICALS)) {
    await flavorLab.upsertBotanical(slug, dto);
    console.log(`botanical: ${slug}`);
  }

  for (const [id, dto] of Object.entries(PROJECTS)) {
    await flavorLab.upsertProjectWithId(id, dto);
    console.log(`project: ${id}`);
  }

  for (const id of RETIRED_PROJECT_IDS) {
    await flavorLab.removeProject(id).catch(() => undefined);
    console.log(`removed (if existed): ${id}`);
  }

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
