import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultSave, loadSave, saveSave } from '../../utils/storage.ts';

type Store = {
  value: string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function installStorage(options: { initial?: string | null; failRead?: boolean; failWrite?: boolean } = {}) {
  const store: Store = {
    value: options.initial ?? null,
    getItem(key) {
      if (options.failRead) throw new Error('storage read denied');
      return key === 'fish_math_save' ? this.value : null;
    },
    setItem(key, value) {
      if (options.failWrite) throw new Error('quota exceeded');
      if (key === 'fish_math_save') this.value = value;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: store,
  });
  return store;
}

test('loadSave recovers from malformed JSON without throwing', () => {
  installStorage({ initial: '{broken json' });
  const loaded = loadSave();
  assert.equal(loaded.saveVersion, 2);
  assert.equal(loaded.highScore, 0);
});

test('loadSave normalizes incomplete data and invalid field types', () => {
  installStorage({
    initial: JSON.stringify({
      saveVersion: 'old',
      highScore: 'not-a-number',
      totalCorrect: -8,
      coins: 12.8,
      hasSharkPet: 'yes',
      starsPerEpisode: { '1-1': 9, '99-99': 3, invalid: 2 },
      aquarium: [{ body: 'blue', outline: 'navy', size: 'bad' }, null, { body: 42 }],
      tableStats: { '2': { attempts: 3, correct: 9, totalResponseTime: -1 } },
    }),
  });

  const loaded = loadSave();
  assert.equal(loaded.saveVersion, 2);
  assert.equal(loaded.highScore, 0);
  assert.equal(loaded.totalCorrect, 0);
  assert.equal(loaded.coins, 12);
  assert.equal(loaded.hasSharkPet, false);
  assert.equal(loaded.starsPerEpisode['1-1'], 3);
  assert.equal(loaded.starsPerEpisode['99-99'], undefined);
  assert.equal(loaded.starsPerEpisode.invalid, undefined);
  assert.equal(loaded.aquarium.length, 1);
  assert.equal(loaded.aquarium[0].size, 24);
  assert.equal(loaded.tableStats['2'].correct, 3);
  assert.equal(loaded.tableStats['2'].totalResponseTime, 0);
});

test('loadSave preserves compatible progress fields from a legacy save and normalizes to version 2', () => {
  installStorage({
    initial: JSON.stringify({
      saveVersion: 1,
      highScore: 420,
      bestCombo: 7,
      totalCorrect: 32,
      totalPlayed: 40,
      coins: 19,
      starsPerEpisode: { '1-1': 3, '2-4': 2 },
      lastPlayDate: '1405-07-20',
      hasSharkPet: true,
    }),
  });

  const loaded = loadSave();
  assert.equal(loaded.saveVersion, 2);
  assert.equal(loaded.highScore, 420);
  assert.equal(loaded.bestCombo, 7);
  assert.equal(loaded.totalCorrect, 32);
  assert.equal(loaded.totalPlayed, 40);
  assert.equal(loaded.coins, 19);
  assert.deepEqual(loaded.starsPerEpisode, { '1-1': 3, '2-4': 2 });
  assert.equal(loaded.lastPlayDate, '1405-07-20');
  assert.equal(loaded.hasSharkPet, true);
});

test('loadSave returns defaults when reading localStorage throws', () => {
  installStorage({ failRead: true });
  assert.deepEqual(loadSave(), getDefaultSave());
});

test('saveSave returns false rather than throwing when localStorage write fails', () => {
  installStorage({ failWrite: true });
  assert.equal(saveSave(getDefaultSave()), false);
});

test('saveSave writes serialized save data when storage is available', () => {
  const store = installStorage();
  const save = { ...getDefaultSave(), highScore: 123 };
  assert.equal(saveSave(save), true);
  assert.equal(JSON.parse(store.value ?? '{}').highScore, 123);
});
