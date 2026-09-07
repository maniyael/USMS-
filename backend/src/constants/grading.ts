export interface GradeScaleBand {
  letter: string;
  points: number;
  min: number;
  max: number;
}

export const DEFAULT_GRADE_SCALE: GradeScaleBand[] = [
  { letter: 'A', points: 4.0, min: 70, max: 100 },
  { letter: 'B', points: 3.0, min: 60, max: 69 },
  { letter: 'C', points: 2.0, min: 50, max: 59 },
  { letter: 'D', points: 1.0, min: 45, max: 49 },
  { letter: 'F', points: 0.0, min: 0, max: 44 },
];

export interface GradingConfiguration {
  bands: GradeScaleBand[];
  passMark?: number;
}

const config: GradingConfiguration = {
  bands: DEFAULT_GRADE_SCALE,
  passMark: 45,
};

export function setGradingConfiguration(newConfig: GradingConfiguration): void {
  config.bands = newConfig.bands;
  config.passMark = newConfig.passMark ?? 45;
}

export function getGradingConfiguration(): GradingConfiguration {
  return { bands: [...config.bands], passMark: config.passMark };
}

export function scoreToGrade(score: number): { letter: string; points: number } | null {
  for (const band of config.bands) {
    if (score >= band.min && score <= band.max) {
      return { letter: band.letter, points: band.points };
    }
  }
  return null;
}

export function computeGpaWeighted(items: { points: number; credits: number }[]): {
  points: number;
  creditsAttempted: number;
  creditsEarned: number;
} {
  let totalPoints = 0;
  let credits = 0;
  for (const item of items) {
    totalPoints += item.points * item.credits;
    credits += item.credits;
  }
  const gpa = credits > 0 ? totalPoints / credits : 0;
  const creditsEarned = items.reduce((acc, i) => (i.points > 0 ? acc + i.credits : acc), 0);
  return {
    points: Math.round(gpa * 100) / 100,
    creditsAttempted: credits,
    creditsEarned,
  };
}