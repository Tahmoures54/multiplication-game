// ===== سیستم ذخیره‌سازی محلی =====

import type { SaveData, CaughtFish } from '../types';
import { DEFAULT_ACHIEVEMENTS, DEFAULT_POWERUPS, TOTAL_SEASONS, EPISODES_PER_SEASON } from '../constants.ts';

const STORAGE_KEY = 'fish_math_save';
const SAVE_VERSION = 2;
const MAX_AQUARIUM_FISH = 50;
const MAX_COUNTER = Number.MAX_SAFE_INTEGER;

function nonNegativeInt(value: unknown, fallback = 0, max = MAX_COUNTER): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

function nonNegativeNumber(value: unknown, fallback = 0, max = MAX_COUNTER): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(0, parsed));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeAquarium(value: unknown): CaughtFish[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((fish): fish is Record<string, unknown> => isRecord(fish))
    .filter(fish => typeof fish.body === 'string' && typeof fish.outline === 'string')
    .slice(-MAX_AQUARIUM_FISH)
    .map(fish => ({
      body: (fish.body as string).slice(0, 80),
      outline: (fish.outline as string).slice(0, 80),
      size: Math.min(100, Math.max(1, nonNegativeNumber(fish.size, 24))),
      ...(Number.isFinite(Number(fish.value)) ? { value: nonNegativeInt(fish.value) } : {}),
      ...(fish.kind === 'normal' || fish.kind === 'rare' || fish.kind === 'golden' ? { kind: fish.kind } : {}),
      ...(Number.isFinite(Number(fish.timestamp)) && Number(fish.timestamp) > 0 ? { timestamp: nonNegativeNumber(fish.timestamp) } : {}),
    }));
}

function normalizeStars(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const stars: Record<string, number> = {};
  for (const [key, rawStars] of Object.entries(value)) {
    const match = /^([0-9]+)-([0-9]+)$/.exec(key);
    if (!match) continue;
    const season = Number(match[1]);
    const episode = Number(match[2]);
    if (season < 1 || season > TOTAL_SEASONS || episode < 1 || episode > EPISODES_PER_SEASON) continue;
    stars[key] = Math.min(3, nonNegativeInt(rawStars));
  }
  return stars;
}

function normalizeTableStats(value: unknown): SaveData['tableStats'] {
  if (!isRecord(value)) return {};
  const result: SaveData['tableStats'] = {};
  for (const [key, rawStat] of Object.entries(value)) {
    const factor = Number(key);
    if (!Number.isInteger(factor) || factor < 1 || factor > 12 || !isRecord(rawStat)) continue;
    const attempts = nonNegativeInt(rawStat.attempts);
    const correct = Math.min(attempts, nonNegativeInt(rawStat.correct));
    const best = Number(rawStat.bestResponseTime);
    const bestResponseTime = Number.isFinite(best) && best >= 0 ? best : Number.MAX_SAFE_INTEGER;
    result[key] = {
      attempts,
      correct,
      totalResponseTime: nonNegativeNumber(rawStat.totalResponseTime),
      bestResponseTime,
      currentStreak: Math.min(attempts, nonNegativeInt(rawStat.currentStreak)),
      bestStreak: Math.min(attempts, nonNegativeInt(rawStat.bestStreak)),
    };
  }
  return result;
}

export function getDefaultSave(): SaveData {
  return {
    highScore: 0,
    bestCombo: 0,
    totalCorrect: 0,
    totalPlayed: 0,
    aquarium: [],
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
    sharkSeen: 0,
    hasSharkPet: false,
    coins: 0,
    starsPerEpisode: {},
    lastPlayDate: '',
    powerUps: DEFAULT_POWERUPS.map(p => ({ ...p })),
    tableStats: {},
    saveVersion: SAVE_VERSION,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSave();

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return getDefaultSave();

    const data = parsed as Partial<SaveData>;
    const def = getDefaultSave();

    const oldAchievements = Array.isArray(data.achievements) ? data.achievements : [];
    const achievements = def.achievements.map(base => {
      const old = oldAchievements.find(item => isRecord(item) && item.id === base.id);
      if (!isRecord(old)) return { ...base };
      const unlocked = old.unlocked === true;
      const unlockedAt = nonNegativeNumber(old.unlockedAt, 0);
      return {
        ...base,
        unlocked,
        ...(unlocked && unlockedAt > 0 ? { unlockedAt } : {}),
      };
    });

    const oldPowerUps = Array.isArray(data.powerUps) ? data.powerUps : [];
    const powerUps = def.powerUps.map(base => {
      const old = oldPowerUps.find(item => isRecord(item) && item.type === base.type);
      return {
        ...base,
        count: isRecord(old) ? nonNegativeInt(old.count, base.count, 999) : base.count,
      };
    });

    return {
      ...def,
      highScore: nonNegativeInt(data.highScore),
      bestCombo: nonNegativeInt(data.bestCombo),
      totalCorrect: nonNegativeInt(data.totalCorrect),
      totalPlayed: nonNegativeInt(data.totalPlayed),
      aquarium: normalizeAquarium(data.aquarium),
      achievements,
      sharkSeen: nonNegativeInt(data.sharkSeen),
      hasSharkPet: data.hasSharkPet === true,
      coins: nonNegativeInt(data.coins),
      starsPerEpisode: normalizeStars(data.starsPerEpisode),
      lastPlayDate: typeof data.lastPlayDate === 'string' ? data.lastPlayDate.slice(0, 40) : '',
      powerUps,
      tableStats: normalizeTableStats(data.tableStats),
      saveVersion: SAVE_VERSION,
    };
  } catch {
    // Storage may be unavailable (for example, browser privacy mode) or contain
    // malformed JSON. Keep the game playable with a clean in-memory profile.
    return getDefaultSave();
  }
}

export function saveSave(data: SaveData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // Storage quota/security failures must not crash gameplay.
    return false;
  }
}

export function unlockAchievement(save: SaveData, id: string): boolean {
  const ach = save.achievements.find(a => a.id === id);
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    ach.unlockedAt = Date.now();
    saveSave(save);
    return true;
  }
  return false;
}
