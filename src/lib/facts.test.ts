import { describe, it, expect } from 'vitest';
import { formatComparison, pickFact, FACT_REFERENCES, type FactReference } from './facts';
import { cacheKey } from './useStableFact';

/* Fixtures small enough to reason about — keep them stable so the
   grammar matrix asserts against known data, not the live pool. */

const civic: FactReference = {
  weight: 1975,
  article: 'a',
  singular: '1985 Honda Civic',
  plural: '1985 Honda Civics',
  category: 'vehicle',
};

const tiger: FactReference = {
  weight: 440,
  article: 'an',
  singular: 'adult Bengal tiger',
  plural: 'adult Bengal tigers',
  emphasis: { singular: 'Bengal tiger', plural: 'Bengal tigers' },
  category: 'animal',
};

const boeing: FactReference = {
  weight: 165_000,
  article: 'a',
  singular: 'Boeing 737, empty',
  plural: 'Boeing 737s, empty',
  emphasis: { singular: 'Boeing 737', plural: 'Boeing 737s' },
  category: 'vehicle',
};

const jellyBean: FactReference = {
  weight: 0.55,
  article: 'a',
  singular: 'single jelly bean',
  plural: 'jelly beans',
  emphasis: { singular: 'jelly bean', plural: 'jelly beans' },
  category: 'food',
};

describe('formatComparison — grammar matrix', () => {
  it('count ≈ 1 uses singular + article ("a Civic")', () => {
    expect(formatComparison(1, civic)).toEqual({
      lead: 'a',
      italic: '1985 Honda Civic',
    });
  });

  it('count ≈ 1 with "an" article: "adult" prefix merges into lead', () => {
    // singular "adult Bengal tiger" with emphasis "Bengal tiger" — the
    // "adult " prefix flows into the lead, italic is just "Bengal tiger".
    expect(formatComparison(1, tiger)).toEqual({
      lead: 'an adult',
      italic: 'Bengal tiger',
    });
  });

  it('count > 1.1 uses plural with whole number ("7 Civics")', () => {
    expect(formatComparison(7, civic)).toEqual({
      lead: '7',
      italic: '1985 Honda Civics',
    });
  });

  it('count > 1.1 within 15% rounds to integer; "adult" prefix in lead', () => {
    // 7.95 → "8 adult Bengal tigers"; lead absorbs "adult"
    expect(formatComparison(7.95, tiger)).toEqual({
      lead: '8 adult',
      italic: 'Bengal tigers',
    });
  });

  it('count > 1.1 outside 15% uses one decimal; prefix preserved', () => {
    expect(formatComparison(8.4, tiger)).toEqual({
      lead: '8.4 adult',
      italic: 'Bengal tigers',
    });
  });

  it('count < 1 uses "% of"; "single" prefix merges into lead', () => {
    // singular "single jelly bean" with emphasis "jelly bean" — the
    // "single " prefix flows into the lead.
    expect(formatComparison(0.4, jellyBean)).toEqual({
      lead: '40% of a single',
      italic: 'jelly bean',
    });
  });

  it('keeps trailing copy outside the italic ("Boeing 737" italic, ", empty" trail)', () => {
    expect(formatComparison(1, boeing)).toEqual({
      lead: 'a',
      italic: 'Boeing 737',
      trail: ', empty',
    });
  });

  it('absorbs noun-phrase prefix into the lead ("fully loaded" before italic)', () => {
    const shippingContainer: FactReference = {
      weight: 60_000,
      article: 'a',
      singular: 'fully loaded shipping container',
      plural: 'fully loaded shipping containers',
      emphasis: { singular: 'shipping container', plural: 'shipping containers' },
      category: 'object',
    };
    // Singular: prefix "fully loaded " merges into lead "≈ a"
    expect(formatComparison(1, shippingContainer)).toEqual({
      lead: 'a fully loaded',
      italic: 'shipping container',
    });
    // Plural: prefix flows into the count-based lead
    expect(formatComparison(5, shippingContainer)).toEqual({
      lead: '5 fully loaded',
      italic: 'shipping containers',
    });
  });

  it('plural trailing copy is preserved ("7 Boeing 737s, empty")', () => {
    expect(formatComparison(7, boeing)).toEqual({
      lead: '7',
      italic: 'Boeing 737s',
      trail: ', empty',
    });
  });

  it('defaults to italicizing the whole noun when emphasis is absent', () => {
    expect(formatComparison(1, civic)).toEqual({
      lead: 'a',
      italic: '1985 Honda Civic',
    });
  });
});

describe('pickFact', () => {
  it('returns null for non-positive totals', () => {
    expect(pickFact(0)).toBeNull();
    expect(pickFact(-100)).toBeNull();
  });

  it('returns structured tokens, not a baked string', () => {
    const fact = pickFact(20_000);
    expect(fact).not.toBeNull();
    expect(typeof fact!.tokens.lead).toBe('string');
    expect(fact!.tokens.lead.length).toBeGreaterThan(0);
    expect(typeof fact!.tokens.italic).toBe('string');
    expect(fact!.tokens.italic.length).toBeGreaterThan(0);
  });

  it('honors category exclusion', () => {
    const allCategories = new Set(FACT_REFERENCES.map((r) => r.category));
    const excluded = ['animal'] as const;
    const fact = pickFact(10_000, [...excluded]);
    expect(fact).not.toBeNull();
    expect(fact!.category).not.toBe('animal');
    // Sanity: the pool still has other categories left.
    expect(allCategories.size).toBeGreaterThan(1);
  });

  it('falls back when the exclusion list empties the pool', () => {
    const allCategories = Array.from(
      new Set(FACT_REFERENCES.map((r) => r.category))
    );
    // Exclude every category — pickFact should return null.
    expect(pickFact(10_000, allCategories)).toBeNull();
  });
});

describe('FACT_REFERENCES data integrity', () => {
  /* Guard: every `emphasis` override must be a literal substring of
     the corresponding singular/plural. Otherwise the renderer silently
     falls back to "italicize the whole noun", which is graceful but
     loses the authoring intent. */
  it('every emphasis is a literal substring of its noun form', () => {
    const violations: string[] = [];
    for (const r of FACT_REFERENCES) {
      if (!r.emphasis) continue;
      if (!r.singular.includes(r.emphasis.singular)) {
        violations.push(
          `singular: "${r.singular}" does not contain emphasis "${r.emphasis.singular}"`
        );
      }
      if (!r.plural.includes(r.emphasis.plural)) {
        violations.push(
          `plural: "${r.plural}" does not contain emphasis "${r.emphasis.plural}"`
        );
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('every entry has matching article shape (a/an/the)', () => {
    const bad = FACT_REFERENCES.filter(
      (r) => !['a', 'an', 'the'].includes(r.article)
    );
    expect(bad).toEqual([]);
  });
});

describe('cacheKey', () => {
  it('rounds total to 10 lb buckets so trivial drift hits the same key', () => {
    // 12_341 → 1234.1 → 1234 → 12340; 12_344 → 1234.4 → 1234 → 12340
    expect(cacheKey('week', 12_341)).toBe(cacheKey('week', 12_344));
    expect(cacheKey('week', 12_341)).toBe('massed:fact:week:12340');
  });

  it('key changes when total crosses a 10 lb bucket boundary', () => {
    // 12_341 lands in bucket 12340; 12_348 lands in bucket 12350.
    expect(cacheKey('week', 12_341)).not.toBe(cacheKey('week', 12_348));
  });

  it('key changes when period changes', () => {
    expect(cacheKey('week', 12_340)).not.toBe(cacheKey('month', 12_340));
  });
});
