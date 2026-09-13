import type { GameState, SaveData } from '../types';
import { SupportFab } from '../components/SupportFab';

interface Props {
  game: GameState;
  saveData: SaveData;
  caughtCount: number;
  seasonLabel: string;
  onReplay: () => void;
  onAquarium: () => void;
  onAchievements: () => void;
  onSupport: () => void;
}

export function GameOverScreen({
  game,
  saveData,
  caughtCount,
  seasonLabel,
  onReplay,
  onAquarium,
  onAchievements,
  onSupport,
}: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/92" />

      <div className="relative z-10 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center overflow-y-auto max-h-full">
        <div className="text-7xl mb-2">{game.gameWon ? '🏆' : '🌊'}</div>
        <h1
          className="text-3xl font-black text-center mb-4 drop-shadow-lg"
          style={{ color: game.gameWon ? '#4ade80' : '#fb7185' }}
        >
          {game.gameWon ? 'آفرین قهرمان!' : 'این دور تموم شد!'}
        </h1>

        <div className="hud-chip w-full p-4 mb-4 space-y-2">
          {[
            { label: 'امتیاز', value: `${game.score} ⭐` },
            { label: 'بهترین کمبو', value: `${game.bestCombo} 🔥` },
            { label: 'فصل', value: `${game.season} ${seasonLabel}` },
            { label: 'ماهی‌ها', value: `${caughtCount} 🐟` },
            { label: 'سکه', value: `${game.coins} 💰` },
            { label: 'رکورد', value: `${saveData.highScore} ⭐` },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-sky-200 text-sm">{item.label}</span>
              <span className="font-black text-white text-lg">{item.value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="w-full py-5 rounded-[1.7rem] text-white font-black text-2xl shadow-lg shadow-sky-500/30 active:scale-95 transition-transform mb-3"
          style={{ background: 'linear-gradient(135deg, #38bdf8, #2563eb)' }}
          onClick={onReplay}
        >
          🔄 دوباره بازی کنیم
        </button>

        <div className="grid grid-cols-2 gap-2 w-full mb-3">
          <button type="button" className="menu-btn bg-sky-500" onClick={onAquarium}>🐟 آکواریوم</button>
          <button type="button" className="menu-btn bg-amber-500" onClick={onAchievements}>🏆 جام‌ها</button>
        </div>

        <SupportFab variant="pill" />
        <button type="button" className="mt-2 text-sky-200/80 text-xs underline" onClick={onSupport}>
          راهنمای پشتیبانی
        </button>
      </div>
    </div>
  );
}
