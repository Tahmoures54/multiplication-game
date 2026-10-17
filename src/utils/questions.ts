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

/**
 * Choose a factor using a smoothed estimate of learning difficulty.
 * A small prior prevents one early mistake from dominating the whole game,
 * while unanswered tables remain more likely than well-practiced tables.
 */
function chooseAdaptiveFactor(
  candidates: number[],
  tableStats?: Record<string, TableStat>,
  avoidFactor?: number
): number {
  const weighted = candidates.map(factor => {
    const stat = tableStats?.[String(factor)];
    const attempts = Math.max(0, stat?.attempts ?? 0);
    const correct = Math.min(attempts, Math.max(0, stat?.correct ?? 0));

    let weight: number;
    if (attempts === 0) {
      weight = 3;
    } else {
      // Laplace smoothing: start with two virtual correct and two incorrect
      // answers so a tiny sample does not create an extreme probability.
      const accuracy = (correct + 2) / (attempts + 4);
      const weakness = 1 - accuracy;
      const streakNeed = (stat?.currentStreak ?? 0) < 3 ? 1 : 0.25;
      weight = 1 + weakness * 6 + streakNeed;
    }

    // Avoid making the same square fact too frequent, without removing it:
    // square facts are still useful and must remain possible.
    if (factor === avoidFactor && candidates.length > 1) weight *= 0.45;
    return { factor, weight };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.factor;
  }
  return candidates[candidates.length - 1];
}

// تولید گزینه‌های اشتباه نزدیک به جواب درست
function generateWrongChoices(correct: number, count: number): number[] {
  const choices = new Set<number>();
  const offsets = [-2, -1, 1, 2, -3, 3, -5, 5, -10, 10];
  for (const off of shuffle(offsets)) {
    const val = correct + off;
    if (val > 0 && val !== correct) choices.add(val);
    if (choices.size >= count) break;
  }

  // A bounded fallback avoids an accidental infinite loop if this helper is
  // ever used with unusual inputs.
  const lower = Math.max(1, Math.floor(correct) - 15);
  const upper = Math.max(lower + count + 1, Math.floor(correct) + 15);
  for (let value = lower; choices.size < count && value <= upper; value++) {
    if (value !== correct) choices.add(value);
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
  const safeMin = Math.max(1, Math.min(12, Math.floor(minFactor) || 1));
  const safeMax = Math.max(safeMin, Math.min(12, Math.floor(maxFactor) || safeMin));
  const candidates = Array.from({ length: safeMax - safeMin + 1 }, (_, i) => safeMin + i);
  const a = chooseAdaptiveFactor(candidates, tableStats);
  const b = chooseAdaptiveFactor(candidates, tableStats, a);
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
      // False statements must differ from the correct product; zero was previously
      // a possible offset and accidentally generated a true statement.
      const wrongOffsets = [-3, -2, -1, 1, 2, 3].filter(offset => correct + offset > 0);
      const wrongOffset = wrongOffsets[randomInt(0, wrongOffsets.length - 1)];
      const proposed = isCorrectProposal ? correct : correct + wrongOffset;
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

export function generateBossQuestion(
  season: number,
  tableStats?: Record<string, TableStat>
): Question {
  const maxF = Math.max(3, Math.min(12, 5 + Math.floor(season)));
  const candidates = Array.from({ length: maxF - 2 }, (_, i) => i + 3);
  const a = chooseAdaptiveFactor(candidates, tableStats);
  const b = chooseAdaptiveFactor(candidates, tableStats, a);
  const correct = a * b;
  return withChoices({
    type: 'normal',
    a, b, correct,
    display: `${a} × ${b} = ؟`,
  });
}