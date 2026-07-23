export const BARREL_LITERS: Record<string, number> = {
  '5L': 5,
  '10L': 10,
  '20L': 20,
  '40L': 40,
};

/** Only one char level exists today; kept as an id so more can be added later without a migration. */
export const CHAR_LEVEL_DEFAULT = 'char3';

export const AGING_ENVIRONMENTS = ['premium_room', 'music_432hz'] as const;
export const AGING_ENVIRONMENT_DEFAULT: (typeof AGING_ENVIRONMENTS)[number] = 'premium_room';

export interface EnhancementOption {
  id: string;
  priceZp: number;
}

/** Flat-fee flavor add-ons purchasable any time while a barrel is still aging. */
export const AGING_ENHANCEMENTS: Record<string, EnhancementOption> = {
  vanilla_boost: { id: 'vanilla_boost', priceZp: 10000 },
  deep_oak: { id: 'deep_oak', priceZp: 5000 },
  caramel_reserve: { id: 'caramel_reserve', priceZp: 10000 },
};

export interface FinishingOption {
  id: string;
  pricePerLiterZp: number;
  minDays: number;
  maxDays: number;
}

/** Pre-bottling finishing pass, priced per liter of barrel capacity; one per barrel. */
export const FINISHING_OPTIONS: Record<string, FinishingOption> = {
  coffee: { id: 'coffee', pricePerLiterZp: 10000, minDays: 30, maxDays: 90 },
  cacao: { id: 'cacao', pricePerLiterZp: 10000, minDays: 30, maxDays: 90 },
  vanilla: { id: 'vanilla', pricePerLiterZp: 10000, minDays: 30, maxDays: 60 },
  cinnamon: { id: 'cinnamon', pricePerLiterZp: 10000, minDays: 15, maxDays: 45 },
  star_anise: { id: 'star_anise', pricePerLiterZp: 10000, minDays: 15, maxDays: 30 },
};
