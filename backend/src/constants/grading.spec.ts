import { DEFAULT_GRADE_SCALE, computeGpaWeighted, scoreToGrade } from './grading';

describe('grading constants', () => {
  describe('scoreToGrade', () => {
    it('maps boundary scores to expected bands', () => {
      expect(scoreToGrade(100)?.letter).toBe('A');
      expect(scoreToGrade(70)?.letter).toBe('A');
      expect(scoreToGrade(69)?.letter).toBe('B');
      expect(scoreToGrade(60)?.letter).toBe('B');
      expect(scoreToGrade(59)?.letter).toBe('C');
      expect(scoreToGrade(50)?.letter).toBe('C');
      expect(scoreToGrade(49)?.letter).toBe('D');
      expect(scoreToGrade(45)?.letter).toBe('D');
      expect(scoreToGrade(44)?.letter).toBe('F');
      expect(scoreToGrade(0)?.letter).toBe('F');
    });

    it('returns grade points consistent with the scale', () => {
      expect(scoreToGrade(85)).toEqual({ letter: 'A', points: 4.0 });
      expect(scoreToGrade(62)).toEqual({ letter: 'B', points: 3.0 });
    });

    it('returns null out of range', () => {
      expect(scoreToGrade(-1)).toBeNull();
      expect(scoreToGrade(101)).toBeNull();
    });

    it('covers the full 0-100 range without gaps', () => {
      for (let s = 0; s <= 100; s++) {
        expect(scoreToGrade(s)).not.toBeNull();
      }
    });

    it('bands are ordered and non-overlapping', () => {
      const sorted = [...DEFAULT_GRADE_SCALE].sort((a, b) => a.min - b.min);
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].max).toBeLessThan(sorted[i + 1].min);
      }
    });
  });

  describe('computeGpaWeighted', () => {
    it('computes weighted GPA across courses', () => {
      const result = computeGpaWeighted([
        { points: 4.0, credits: 3 },
        { points: 3.0, credits: 3 },
      ]);
      expect(result.points).toBe(3.5);
      expect(result.creditsAttempted).toBe(6);
      expect(result.creditsEarned).toBe(6);
    });

    it('does not award credits for failed courses', () => {
      const result = computeGpaWeighted([
        { points: 4.0, credits: 3 },
        { points: 0.0, credits: 2 },
      ]);
      expect(result.points).toBeCloseTo(2.4, 1);
      expect(result.creditsAttempted).toBe(5);
      expect(result.creditsEarned).toBe(3);
    });

    it('returns zero GPA with no courses', () => {
      const result = computeGpaWeighted([]);
      expect(result.points).toBe(0);
      expect(result.creditsAttempted).toBe(0);
      expect(result.creditsEarned).toBe(0);
    });
  });
});