import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdultGateAnswerCorrect, normalizeNumerals } from '../../utils/parentalGate.ts';

test('adult gate accepts the correct answer in English, Persian, or Arabic numerals', () => {
  assert.equal(isAdultGateAnswerCorrect('51'), true);
  assert.equal(isAdultGateAnswerCorrect('۵۱'), true);
  assert.equal(isAdultGateAnswerCorrect('٥١'), true);
  assert.equal(isAdultGateAnswerCorrect(' ۵۱ '), true);
});

test('adult gate rejects incorrect, incomplete, and decorated answers', () => {
  assert.equal(isAdultGateAnswerCorrect('4'), false);
  assert.equal(isAdultGateAnswerCorrect('52'), false);
  assert.equal(isAdultGateAnswerCorrect(''), false);
  assert.equal(isAdultGateAnswerCorrect('۵۱ جواب'), false);
});

test('numeral normalization does not alter unrelated characters', () => {
  assert.equal(normalizeNumerals('۱۲٣abc'), '123abc');
});
