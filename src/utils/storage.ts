// ===== سیستم ذخیره‌سازی در localStorage =====

import type { SaveData } from '../types';
import { DEFAULT_ACHIEVEMENTS, DEFAULT_POWERUPS } from '../constants';

const STORAGE_KEY = 'fish_math_save';

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
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SaveData;
      // اطمینان از وجود فیلدهای جدید
      const def = getDefaultSave();
      return { ...def, ...data };
    }
  } catch (e) {
    // ignore
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