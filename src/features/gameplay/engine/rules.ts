import { BASE_TIME_LIMIT } from '../../../constants.ts';
import type { VisualSeason } from '../../../types.ts';

const VISUAL_SEASONS: readonly VisualSeason[] = ['spring', 'summer', 'autumn', 'winter'];

/** Returns the visual season used by a numbered game season. */
export function getVisualSeason(season: number): VisualSeason {
  const index = ((Math.trunc(season) - 1) % VISUAL_SEASONS.length + VISUAL_SEASONS.length) % VISUAL_SEASONS.length;
  return VISUAL_SEASONS[index];
}

/** The largest multiplication factor allowed in a game season. */
export function maxFactorForSeason(season: number): number {
  if (season <= 2) return 5;
  if (season <= 4) return 7;
  if (season <= 6) return 9;
  if (season <= 8) return 10;
  return 12;
}

/** Time limit in seconds, retaining the existing difficulty progression. */
export function currentTimeLimit(season: number): number {
  return Math.max(8, BASE_TIME_LIMIT - Math.floor(season / 2));
}

/** Calculates the existing one-to-three-star reward without UI dependencies. */
export function calculateStars(
  timeLeft: number,
  timeLimit: number,
  lives: number,
  combo: number,
): number {
  const timeRatio = timeLimit > 0 ? timeLeft / timeLimit : 0;
  let stars = 1;
  if (timeRatio > 0.5 && lives >= 3) stars = 2;
  if (timeRatio > 0.7 && lives >= 4 && combo >= 2) stars = 3;
  return stars;
}
