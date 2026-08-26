// ===== سیستم ذخیره‌سازی در localStorage =====

import type { SaveData } from '../types';
import { DEFAULT_ACHIEVEMENTS, DEFAULT_POWERUPS } from '../constants';

const STORAGE_KEY = 'fish_math_save';
const SAVE_VERSION = 2;

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
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveData>;
      const def = getDefaultSave();
      const merged: SaveData = {
        ...def,
        ...data,
        aquarium: Array.isArray(data.aquarium) ? data.aquarium : def.aquarium,
        achievements: Array.isArray(data.achievements) ? data.achievements : def.achievements,
        powerUps: Array.isArray(data.powerUps) ? data.powerUps : def.powerUps,
        starsPerEpisode: data.starsPerEpisode && typeof data.starsPerEpisode === 'object' ? data.starsPerEpisode : {},
        tableStats: {},
        saveVersion: SAVE_VERSION,
      };
      // Normalize table statistics and prevent invalid values from old/corrupt saves.
      if (data.tableStats && typeof data.tableStats === 'object') {
        for (const [key, rawStat] of Object.entries(data.tableStats)) {
          const stat = rawStat as Partial<SaveData['tableStats'][string]>;
          merged.tableStats[key] = {
            attempts: Math.max(0, Number(stat.attempts) || 0),
            correct: Math.max(0, Number(stat.correct) || 0),
            totalResponseTime: Math.max(0, Number(stat.totalResponseTime) || 0),
            bestResponseTime: Number.isFinite(Number(stat.bestResponseTime)) ? Number(stat.bestResponseTime) : Number.MAX_SAFE_INTEGER,
            currentStreak: Math.max(0, Number(stat.currentStreak) || 0),
            bestStreak: Math.max(0, Number(stat.bestStreak) || 0),
          };
        }
      }

      // Normalize new/removed achievements and power-ups across app updates.
      merged.achievements = def.achievements.map(base => {
        const old = merged.achievements.find(a => a.id === base.id);
        return old ? { ...base, ...old } : { ...base };
      });
      merged.powerUps = def.powerUps.map(base => {
        const old = merged.powerUps.find(p => p.type === base.type);
        return old ? { ...base, ...old, count: Math.max(0, Number(old.count) || 0) } : { ...base };
      });
      return merged;
    }
  } catch {
    // Corrupt/invalid saves are safely replaced with a fresh profile.
  }
  return getDefaultSave();
}

export function saveSave(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
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