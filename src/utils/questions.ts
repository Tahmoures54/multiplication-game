// ===== سیستم تولید سوالات متنوع =====

import type { Question, QuestionType } from '../types';

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
  forceType?: QuestionType
): Question {
  const a = randomInt(minFactor, maxFactor);
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
      return {
        type: 'missing',
        a, b,
        correct: missingA ? a : b,
        display,
      };
    }

    case 'multichoice': {
      const wrongChoices = generateWrongChoices(correct, 3);
      const choices = shuffle([correct, ...wrongChoices]);
      return {
        type: 'multichoice',
        a, b, correct,
        display: `${a} × ${b} = ؟`,
        choices,
      };
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
      const chainResult = correct * c;
      return {
        type: 'chain',
        a, b,
        correct: chainResult,
        display: `${a} × ${b} = ${correct}`,
        chainDisplay: `${correct} × ${c} = ؟`,
      };
    }

    default: {
      return {
        type: 'normal',
        a, b, correct,
        display: `${a} × ${b} = ؟`,
      };
    }
  }
}

export function generateBossQuestion(season: number): Question {
  const maxF = Math.min(12, 5 + season);
  const a = randomInt(3, maxF);
  const b = randomInt(3, maxF);
  const correct = a * b;
  // باس همیشه سوال معمولی ولی سخت‌تر
  return {
    type: 'normal',
    a, b, correct,
    display: `${a} × ${b} = ؟`,
  };
}