import type { ResponseMap } from "./scoring";

export interface ParsedAiAnswers {
  values: ResponseMap;
  errors: string[];
}

export function parseAiAnswers(raw: string, expectedCount = 60): ParsedAiAnswers {
  const errors: string[] = [];
  const trimmed = raw.trim();

  if (!trimmed) {
    return { values: {}, errors: ["No text provided."] };
  }

  // Strategy 1: JSON array or object with numeric keys
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const values: ResponseMap = {};
      parsed.forEach((v, i) => {
        if (typeof v === "number" && v >= 1 && v <= 5) {
          values[i + 1] = v;
        }
      });
      if (Object.keys(values).length === expectedCount) {
        return { values, errors };
      }
      errors.push(
        `JSON array parse produced ${Object.keys(values).length} valid values; expected ${expectedCount}.`,
      );
    } else if (parsed && typeof parsed === "object") {
      // Handle objects like { "1": 2, "2": 3, ... }
      const values: ResponseMap = {};
      for (const [key, v] of Object.entries(parsed)) {
        const idx = Number(key);
        if (!Number.isInteger(idx)) continue;
        if (idx < 1 || idx > expectedCount) continue;
        if (typeof v === "number" && v >= 1 && v <= 5) {
          values[idx] = v;
        }
      }
      const count = Object.keys(values).length;
      if (count > 0) {
        if (count === expectedCount) {
          return { values, errors };
        }
        errors.push(
          `JSON object parse produced ${count} valid values; expected ${expectedCount}.`,
        );
        // Fall through to line-based parsing as a fallback
      }
    }
  } catch {
    // fall through to other strategies
  }

  // Strategy 2: line-based "1. 4" or "Q1: 4" formats
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim());
  const sequentialValues: number[] = [];
  const indexedValues: ResponseMap = {};

  for (const line of lines) {
    if (!line) continue;

    // Extract question number if present, e.g. "1.", "Q1:", "Item 1 -"
    const idxMatch = line.match(/(?:^|\s)(?:Q|Item)?\s*(\d{1,2})(?=[^\d]|$)/i);
    const valueMatch = line.match(/([1-5])(?!\d)/);

    if (!valueMatch) continue;

    const value = Number(valueMatch[1]);

    if (idxMatch) {
      const qIndex = Number(idxMatch[1]);
      if (qIndex >= 1 && qIndex <= expectedCount) {
        indexedValues[qIndex] = value;
      }
    } else {
      sequentialValues.push(value);
    }
  }

  let values: ResponseMap = {};

  if (Object.keys(indexedValues).length > 0) {
    values = indexedValues;
  } else if (sequentialValues.length > 0) {
    sequentialValues.forEach((v, i) => {
      if (i + 1 <= expectedCount) {
        values[i + 1] = v;
      }
    });
  }

  const count = Object.keys(values).length;
  if (count !== expectedCount) {
    errors.push(
      `Parsed ${count} answers; expected ${expectedCount}. Please ensure the AI output clearly contains one 1-5 answer per question.`,
    );
  }

  return { values, errors };
}
