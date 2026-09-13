import { INITIAL_LIVES } from '../constants';
import type { GameState } from '../types';

interface Props {
  game: GameState;
  seasonLabel: string;
  timerPercent: number;
  timerColor: string;
}

export function GameHud({ game, seasonLabel, timerPercent, timerColor }: Props) {
  const lives = '❤️'.repeat(game.lives) + '🖤'.repeat(Math.max(0, INITIAL_LIVES - game.lives));

  return (
    <div className="w-full shrink-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="hud-chip flex-1 text-center">
          <div className="hud-label">جان</div>
          <div className="text-base leading-none">{lives}</div>
        </div>
        <div className="hud-chip w-[5.5rem] text-center">
          <div className="hud-label">زمان</div>
          <div className="text-xl font-black" style={{ color: timerColor }}>
            {game.timeFrozen ? '❄️' : game.timeLeft}
          </div>
        </div>
        <div className="hud-chip flex-1 text-center">
          <div className="hud-label">امتیاز</div>
          <div className="text-lg font-black text-amber-300">{game.score} ⭐</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="hud-chip text-center">
          <div className="hud-label">فصل</div>
          <div className="text-sm font-bold text-sky-200">{seasonLabel}{game.season}-{game.episode}</div>
        </div>
        <div className="hud-chip text-center">
          <div className="hud-label">کمبو</div>
          <div className="text-sm font-bold text-emerald-300">🔥 {game.combo}</div>
        </div>
        <div className="hud-chip text-center">
          <div className="hud-label">سکه</div>
          <div className="text-sm font-bold text-amber-200">💰 {game.coins}</div>
        </div>
      </div>

      <div className="h-2.5 bg-slate-950/70 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${timerPercent}%`,
            backgroundColor: timerColor,
            boxShadow: game.timeLeft <= 3 ? '0 0 10px rgba(239,68,68,0.5)' : 'none',
          }}
        />
      </div>

      {(game.shieldActive || game.timeFrozen) && (
        <div className="flex gap-2 justify-center">
          {game.shieldActive && (
            <span className="bg-purple-500/40 text-purple-100 px-3 py-0.5 rounded-full text-xs font-bold">🛡️ محافظ فعال</span>
          )}
          {game.timeFrozen && (
            <span className="bg-cyan-500/40 text-cyan-100 px-3 py-0.5 rounded-full text-xs font-bold animate-pulse">❄️ زمان یخ‌زده</span>
          )}
        </div>
      )}
    </div>
  );
}
