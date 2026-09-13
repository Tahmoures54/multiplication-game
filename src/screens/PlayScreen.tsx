import { GameHud } from '../components/GameHud';
import { ChoiceGrid } from '../components/ChoiceGrid';
import type { GameState, PowerUp } from '../types';

interface Props {
  game: GameState;
  seasonLabel: string;
  timerPercent: number;
  timerColor: string;
  onChoice: (choice: number) => void;
  onTrueFalse: (isTrue: boolean) => void;
  onHint: () => void;
  onSkip: () => void;
  onPause: () => void;
  onSound: () => void;
  onMusic: () => void;
  onPowerUp: (type: PowerUp['type']) => void;
}

export function PlayScreen({
  game,
  seasonLabel,
  timerPercent,
  timerColor,
  onChoice,
  onTrueFalse,
  onHint,
  onSkip,
  onPause,
  onSound,
  onMusic,
  onPowerUp,
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

      <div className="pointer-events-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent pt-6">
        <div className={`rounded-3xl py-3 px-4 text-center shadow-xl ${
          game.isBoss
            ? 'bg-red-950/80 border-2 border-red-400/50'
            : 'bg-slate-900/75 backdrop-blur-md border border-white/10'
        }`}>
          {game.isBoss && (
            <div className="text-xs text-red-200 mb-1">👹 هیولای دریایی ({game.bossHP}/{game.bossMaxHP})</div>
          )}
          <div className="text-3xl font-black text-white tracking-wide">
            {game.question.display}
          </div>
          {game.question.type === 'chain' && game.question.chainDisplay && (
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {game.question.chainDisplay}
            </div>
          )}
          <div className="text-xs text-sky-200 mt-1">
            یکی را انتخاب کن
          </div>
        </div>

        <div className="text-center text-sm font-bold min-h-[20px]" style={{ color: game.feedbackColor }}>
          {game.feedbackText}
        </div>

        {game.question.type === 'truefalse' ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className="flex-1 py-5 rounded-[1.6rem] text-white font-black text-2xl active:scale-95 transition-transform shadow-lg"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              onClick={() => onTrueFalse(true)}
              disabled={locked}
            >
              ✅ درسته
            </button>
            <button
              type="button"
              className="flex-1 py-5 rounded-[1.6rem] text-white font-black text-2xl active:scale-95 transition-transform shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
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

        <div className="grid grid-cols-5 gap-1.5">
          <button type="button" className="ctrl-btn bg-amber-500" onClick={onHint}>💡</button>
          <button type="button" className="ctrl-btn bg-rose-500" onClick={onSkip}>⏭️</button>
          <button type="button" className="ctrl-btn bg-violet-500" onClick={onPause}>{game.paused ? '▶️' : '⏸️'}</button>
          <button type="button" className="ctrl-btn bg-slate-600" onClick={onSound}>{game.soundOn ? '🔊' : '🔇'}</button>
          <button type="button" className="ctrl-btn bg-sky-600" onClick={onMusic}>{game.musicOn ? '🎵' : '🔇'}</button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {game.powerUps.map((pu, i) => (
            <button
              key={i}
              type="button"
              className={`ctrl-btn bg-cyan-700 relative ${pu.count <= 0 ? 'opacity-40' : ''}`}
              onClick={() => onPowerUp(pu.type)}
              disabled={pu.count <= 0 || locked}
            >
              {pu.emoji}
              <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {pu.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {game.paused && (
        <div className="absolute inset-0 z-20 pointer-events-auto flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-6">
          <div className="bg-slate-900/95 rounded-3xl p-6 w-full max-w-sm text-center border border-white/10">
            <div className="text-5xl mb-3">⏸️</div>
            <h2 className="text-white font-black text-2xl mb-2">ایست!</h2>
            <p className="text-sky-200 text-sm mb-5">هر وقت آماده بودی ادامه بده.</p>
            <button
              type="button"
              className="w-full py-4 rounded-2xl text-white font-black text-xl"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
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
