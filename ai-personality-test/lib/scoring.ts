import type { BigFiveDomain } from "./ipip-neo-60";
import { IPIP_NEO_60 } from "./ipip-neo-60";

export type TraitKey = BigFiveDomain;

export type TraitScores = Record<TraitKey, number>;

export interface ScoreSummary {
  human: TraitScores;
  ai: TraitScores;
  perTrait: {
    trait: TraitKey;
    human: number;
    ai: number;
    absoluteDifference: number;
  }[];
  meanAbsoluteDifference: number;
  similarity: number; // 0-1, higher = more similar
}

export function emptyTraitScores(): TraitScores {
  return { O: 0, C: 0, E: 0, A: 0, N: 0 };
}

// Normalize 1-5 Likert to 0-100
function normalizeLikert(value: number): number {
  return ((value - 1) / 4) * 100;
}

export type ResponseMap = Record<number, number>; // questionIndex -> raw 1-5 value

export function computeTraitScores(responses: ResponseMap): TraitScores {
  const scores: Record<TraitKey, number> = emptyTraitScores();
  const counts: Record<TraitKey, number> = emptyTraitScores();

  for (const item of IPIP_NEO_60) {
    const raw = responses[item.index];
    if (raw == null) continue;

    if (raw < 1 || raw > 5) continue;

    const keyedValue =
      item.keyedDirection === "reverse" ? 6 - raw : raw;

    const norm = normalizeLikert(keyedValue);
    scores[item.domain] += norm;
    counts[item.domain] += 1;
  }

  (Object.keys(scores) as TraitKey[]).forEach((trait) => {
    if (counts[trait] > 0) {
      scores[trait] = scores[trait] / counts[trait];
    } else {
      scores[trait] = 0;
    }
  });

  return scores;
}

export function compareTraitScores(
  human: TraitScores,
  ai: TraitScores,
): ScoreSummary {
  const traits: TraitKey[] = ["O", "C", "E", "A", "N"];

  const perTrait = traits.map((trait) => {
    const h = human[trait] ?? 0;
    const a = ai[trait] ?? 0;
    const diff = Math.abs(h - a);
    return {
      trait,
      human: h,
      ai: a,
      absoluteDifference: diff,
    };
  });

  const meanAbsoluteDifference =
    perTrait.reduce((sum, t) => sum + t.absoluteDifference, 0) /
    perTrait.length;

  const similarity = 1 - meanAbsoluteDifference / 100;

  return {
    human,
    ai,
    perTrait,
    meanAbsoluteDifference,
    similarity,
  };
}
