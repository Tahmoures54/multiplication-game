import { GameHud } from '../components/GameHud';
import { ChoiceGrid } from '../components/ChoiceGrid';
import type { GameState } from '../types';

interface Props {
  game: GameState;
  seasonLabel: string;
  timerPercent: number;
  timerColor: string;
  onChoice: (choice: number) => void;
  onTrueFalse: (isTrue: boolean) => void;
  onPause: () => void;
}

export function PlayScreen({
  game,
  seasonLabel,
  timerPercent,
  timerColor,
  onChoice,
  onTrueFalse,
  onPause,
}: Props) {
  const locked = game.paused || !game.timerRunning;
  const choices = game.question.choices ?? [];

  return (
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
      <div className="pointer-events-auto px-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <GameHud
          game={game}
          seasonLabel={seasonLabel}
          timerPercent={timerPercent}
          timerColor={timerColor}
        />
      </div>

      <div className="flex-1 min-h-[4rem]" />

      <div className="pointer-events-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2 pt-3">
        <div className={`question-glass rounded-3xl py-2.5 px-4 text-center ${
          game.isBoss ? 'border-red-300/40' : ''
        }`}>
          {game.isBoss && (
            <div className="text-xs text-red-100 mb-1">👹 هیولای دریایی ({game.bossHP}/{game.bossMaxHP})</div>
          )}
          <div className="text-3xl font-black text-white tracking-wide drop-shadow-lg">
            {game.question.display}
          </div>
          {game.question.type === 'chain' && game.question.chainDisplay && (
            <div className="text-2xl font-bold text-amber-200 mt-1 drop-shadow">
              {game.question.chainDisplay}
            </div>
          )}
          <div className="text-xs text-white/80 mt-1">یکی را انتخاب کن</div>
        </div>

        <div className="text-center text-sm font-bold min-h-[20px] drop-shadow-lg" style={{ color: game.feedbackColor }}>
          {game.feedbackText}
        </div>

        {game.question.type === 'truefalse' ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className="glass-answer flex-1 py-4 rounded-[1.6rem] text-white font-black text-2xl active:scale-95 transition-transform"
              onClick={() => onTrueFalse(true)}
              disabled={locked}
            >
              ✅ درسته
            </button>
            <button
              type="button"
              className="glass-answer flex-1 py-4 rounded-[1.6rem] text-white font-black text-2xl active:scale-95 transition-transform"
              onClick={() => onTrueFalse(false)}
              disabled={locked}
            >
              ❌ غلطه
            </button>
          </div>
        ) : (
          <ChoiceGrid
            choices={choices}
            selected={game.selectedChoice}
            correct={game.question.correct}
            disabled={locked}
            onPick={onChoice}
          />
        )}
      </div>

      {game.paused && (
        <div className="absolute inset-0 z-20 pointer-events-auto flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] px-6">
          <div className="question-glass rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="text-5xl mb-3">⏸️</div>
            <h2 className="text-white font-black text-2xl mb-2">ایست!</h2>
            <p className="text-white/80 text-sm mb-5">هر وقت آماده بودی ادامه بده.</p>
            <button
              type="button"
              className="glass-answer w-full py-4 rounded-2xl text-white font-black text-xl"
              onClick={onPause}
            >
              ▶️ ادامه بازی
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
