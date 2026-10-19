import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAnswerReward, calculateStars } from '../../features/gameplay/engine/rules.ts';
import { getDefaultSave, loadSave, saveSave } from '../../utils/storage.ts';

test('domain integration: start a season, complete episodes, persist progress, and reload it', () => {
  const store = { value: null as string | null };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key: string) { return key === 'fish_math_save' ? store.value : null; },
      setItem(key: string, value: string) {
        if (key === 'fish_math_save') store.value = value;
      },
    },
  });

  // Start from the same default save structure used by the app.
  const save = getDefaultSave();
  let score = 0;
  let combo = 0;

  // Simulate ten completed episode outcomes using the production rule helpers.
  for (let episode = 1; episode <= 10; episode += 1) {
    const reward = calculateAnswerReward(12, combo);
    score += reward.gained;
    combo = reward.newCombo;
    const stars = calculateStars(15, 18, 4, combo);
    const key = `1-${episode}`;
    save.starsPerEpisode[key] = Math.max(save.starsPerEpisode[key] ?? 0, stars);
  }

  save.highScore = score;
  save.bestCombo = combo;
  save.totalCorrect = 10;
  save.totalPlayed = 10;

  // Season completion persists through the same save API used by the app.
  assert.equal(saveSave(save), true);
  assert.ok(store.value);

  // A fresh load must preserve the completed-season progress.
  const reloaded = loadSave();
  assert.equal(reloaded.highScore, score);
  assert.equal(reloaded.bestCombo, 10);
  assert.equal(reloaded.totalCorrect, 10);
  assert.equal(reloaded.totalPlayed, 10);
  assert.equal(Object.keys(reloaded.starsPerEpisode).filter(key => key.startsWith('1-')).length, 10);
  for (let episode = 1; episode <= 10; episode += 1) {
    assert.equal(reloaded.starsPerEpisode[`1-${episode}`], 3);
  }
});
