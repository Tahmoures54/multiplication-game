import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnswerReward,
  calculateStars,
  currentTimeLimit,
  getVisualSeason,
  maxFactorForSeason,
  isAnswerCorrect,
} from '../../features/gameplay/engine/rules.ts';

test('visual seasons repeat in a stable four-season cycle', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8].map(getVisualSeason),
    ['spring', 'summer', 'autumn', 'winter', 'spring', 'summer', 'autumn', 'winter'],
  );
});

test('factor limits preserve the current season progression', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(maxFactorForSeason),
    [5, 5, 7, 7, 9, 9, 10, 10, 12, 12],
  );
});

test('time limit decreases gradually but never falls below eight seconds', () => {
  assert.equal(currentTimeLimit(1), 18);
  assert.equal(currentTimeLimit(2), 17);
  assert.equal(currentTimeLimit(10), 13);
  assert.equal(currentTimeLimit(30), 8);
});

test('stars use strict time thresholds and preserve life/combo requirements', () => {
  assert.equal(calculateStars(5, 10, 4, 3), 1);
  assert.equal(calculateStars(6, 10, 2, 3), 1);
  assert.equal(calculateStars(6, 10, 3, 1), 2);
  assert.equal(calculateStars(8, 10, 4, 2), 3);
  assert.equal(calculateStars(8, 10, 4, 1), 2);
  assert.equal(calculateStars(10, 0, 4, 3), 1);
});

test('answer validation accepts only the exact numeric answer', () => {
  assert.equal(isAnswerCorrect(42, 42), true);
  assert.equal(isAnswerCorrect(41, 42), false);
  assert.equal(isAnswerCorrect(-1, 42), false);
});

test('correct-answer rewards preserve score and coin progression', () => {
  assert.deepEqual(calculateAnswerReward(10, 0), {
    newCombo: 1,
    gained: 18,
    coinsGained: 1,
  });
  assert.deepEqual(calculateAnswerReward(10, 2), {
    newCombo: 3,
    gained: 24,
    coinsGained: 2,
  });
  assert.deepEqual(calculateAnswerReward(10, 10), {
    newCombo: 11,
    gained: 40,
    coinsGained: 4,
  });
});
