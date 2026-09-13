// ===== سیستم تولید سوالات متنوع =====

import type { Question, QuestionType, TableStat } from '../types';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// تولید گزینه‌های اشتباه نزدیک به جواب درست
function generateWrongChoices(correct: number, count: number): number[] {
  const choices = new Set<number>();
  // گزینه‌های نزدیک
  const offsets = [-2, -1, 1, 2, -3, 3, -5, 5, -10, 10];
  for (const off of shuffle(offsets)) {
    const val = correct + off;
    if (val > 0 && val !== correct) {
      choices.add(val);
    }
    if (choices.size >= count) break;
  }
  // اگر کم بود، اعداد تصادفی اضافه کن
  while (choices.size < count) {
    const val = randomInt(Math.max(1, correct - 15), correct + 15);
    if (val > 0 && val !== correct) {
      choices.add(val);
    }
  }
  return Array.from(choices).slice(0, count);
}

export function generateQuestion(
  season: number,
  maxFactor: number,
  minFactor: number = 1,
  forceType?: QuestionType,
  tableStats?: Record<string, TableStat>
): Question {
  // Adaptive selection: favor tables with lower accuracy and less practice.
  const candidates = Array.from({ length: maxFactor - minFactor + 1 }, (_, i) => minFactor + i);
  const weighted = candidates.map(factor => {
    const stat = tableStats?.[String(factor)];
    if (!stat || stat.attempts === 0) return { factor, weight: 3 };
    const accuracy = stat.correct / stat.attempts;
    const weakness = 1 - accuracy;
    const recencyNeed = stat.currentStreak < 3 ? 1 : 0.25;
    return { factor, weight: 1 + weakness * 6 + recencyNeed };
  });
  const totalWeight = weighted.reduce((sum, x) => sum + x.weight, 0);
  let cursor = Math.random() * totalWeight;
  let a = candidates[0];
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) { a = item.factor; break; }
  }
  const b = randomInt(minFactor, maxFactor);
  const correct = a * b;

  // تعیین نوع سوال بر اساس فصل یا اجبار
  let type: QuestionType = forceType || 'normal';
  if (!forceType) {
    if (season <= 2) {
      type = 'normal';
    } else if (season <= 4) {
      // از فصل ۳ شروع سوالات متنوع
      const types: QuestionType[] = ['normal', 'normal', 'missing', 'multichoice'];
      type = types[randomInt(0, types.length - 1)];
    } else if (season <= 7) {
      const types: QuestionType[] = ['normal', 'missing', 'multichoice', 'truefalse'];
      type = types[randomInt(0, types.length - 1)];
    } else {
      const types: QuestionType[] = ['normal', 'missing', 'multichoice', 'truefalse', 'chain'];
      type = types[randomInt(0, types.length - 1)];
    }
  }

  switch (type) {
    case 'missing': {
      // عدد گمشده: a × ? = correct
      const missingA = Math.random() < 0.5;
      const display = missingA
        ? `؟ × ${b} = ${correct}`
        : `${a} × ؟ = ${correct}`;
      const answer = missingA ? a : b;
      return withChoices({
        type: 'missing',
        a, b,
        correct: answer,
        display,
      });
    }

    case 'multichoice': {
      return withChoices({
        type: 'multichoice',
        a, b, correct,
        display: `${a} × ${b} = ؟`,
      });
    }

    case 'truefalse': {
      const isCorrectProposal = Math.random() < 0.5;
      const proposed = isCorrectProposal
        ? correct
        : correct + randomInt(-3, 3) || correct + 1;
      return {
        type: 'truefalse',
        a, b, correct,
        display: `${a} × ${b} = ${proposed}`,
        proposed,
        isProposedCorrect: proposed === correct,
      };
    }

    case 'chain': {
      // زنجیره‌ای: a × b = X, X × c = ?
      const c = randomInt(2, 4);
      const intermediate = correct;
      const chainResult = intermediate * c;
      return withChoices({
        type: 'chain',
        a, b,
        correct: chainResult,
        display: `${a} × ${b} = ${intermediate}`,
        chainDisplay: `${intermediate} × ${c} = ؟`,
      });
    }

    default: {
      return withChoices({
        type: 'normal',
        a, b, correct,
        display: `${a} × ${b} = ؟`,
      });
    }
  }
}

function withChoices(question: Question): Question {
  if (question.type === 'truefalse') return question;
  const wrong = generateWrongChoices(question.correct, 3);
  return { ...question, choices: shuffle([question.correct, ...wrong]) };
}

export function generateBossQuestion(season: number): Question {
  const maxF = Math.min(12, 5 + season);
  const a = randomInt(3, maxF);
  const b = randomInt(3, maxF);
  const correct = a * b;
  return withChoices({
    type: 'normal',
    a, b, correct,
    display: `${a} × ${b} = ؟`,
  });
}