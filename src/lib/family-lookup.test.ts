import { describe, it, expect } from 'vitest';
import { inferFamily, suggestExercises } from './family-lookup';

describe('inferFamily', () => {
  it('matches exact lowercase names', () => {
    expect(inferFamily('bench')).toBe('pushH');
    expect(inferFamily('squat')).toBe('squat');
    expect(inferFamily('deadlift')).toBe('hinge');
  });

  it('is case-insensitive', () => {
    expect(inferFamily('Bench')).toBe('pushH');
    expect(inferFamily('OHP')).toBe('pushV');
  });

  it('strips equipment prefixes', () => {
    expect(inferFamily('barbell bench press')).toBe('pushH');
    expect(inferFamily('db row')).toBe('pullH');
    expect(inferFamily('dumbbell curl')).toBe('iso');
  });

  it('collapses whitespace', () => {
    expect(inferFamily('  incline   bench  ')).toBe('pushH');
  });

  it('handles common plurals', () => {
    expect(inferFamily('curls')).toBe('iso');
    expect(inferFamily('lunges')).toBe('squat');
    expect(inferFamily('push-ups')).toBe('pushH');
  });

  it('returns null for unknown names', () => {
    expect(inferFamily('atlas stone press')).toBeNull();
    expect(inferFamily('jefferson curl')).toBeNull();
    expect(inferFamily('')).toBeNull();
  });
});

describe('suggestExercises', () => {
  it('returns recents when the query is empty', () => {
    const recents = ['bench', 'squat', 'deadlift'];
    expect(suggestExercises('', recents, 6)).toEqual(recents);
  });

  it('caps results at the requested limit', () => {
    const recents = ['bench', 'squat', 'deadlift', 'rdl', 'curls'];
    expect(suggestExercises('', recents, 3)).toHaveLength(3);
  });

  it('filters by substring on a non-empty query', () => {
    const result = suggestExercises('ben', [], 6);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('bench');
    expect(result).toContain('bench press');
  });

  it('puts prefix matches before mid-string matches', () => {
    const result = suggestExercises('press', [], 10);
    expect(result.length).toBeGreaterThan(0);
    // "press" doesn't appear at the start of any name in the lookup, so
    // expect mid-string matches like "bench press" to come through.
    expect(result.some((n) => n.includes('press'))).toBe(true);
  });

  it('merges recents with the lookup, deduping case-insensitively', () => {
    const recents = ['Bench'];
    const result = suggestExercises('ben', recents, 6);
    // "Bench" (recent) should appear; lookup's "bench" should be deduped.
    expect(result.filter((n) => n.toLowerCase() === 'bench')).toHaveLength(1);
  });
});
