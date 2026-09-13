import type { SaveData } from '../types';
import { SupportFab } from '../components/SupportFab';

interface Props {
  saveData: SaveData;
  onStart: () => void;
  onAquarium: () => void;
  onAchievements: () => void;
  onProgress: () => void;
  onSupport: () => void;
}

export function StartScreen({
  saveData,
  onStart,
  onAquarium,
  onAchievements,
  onProgress,
  onSupport,
}: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-950/30 via-transparent to-slate-950/90" />

      <div className="relative z-10 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center overflow-y-auto max-h-full">
        <div className="text-7xl mb-2 drop-shadow-lg animate-bounce">🎣</div>
        <h1 className="text-3xl font-black text-center text-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] mb-1">
          ماهیگیری جدول ضرب
        </h1>
        <p className="text-sky-100 text-center text-sm mb-4 drop-shadow">
          یکی از گزینه‌ها را لمس کن و ماهی بگیر!
        </p>

        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          <div className="hud-chip text-center py-3">
            <div className="hud-label">بهترین</div>
            <div className="text-amber-300 font-black">{saveData.highScore} ⭐</div>
          </div>
          <div className="hud-chip text-center py-3">
            <div className="hud-label">درست‌ها</div>
            <div className="text-emerald-300 font-black">{saveData.totalCorrect} ✅</div>
          </div>
          <div className="hud-chip text-center py-3">
            <div className="hud-label">سکه‌ها</div>
            <div className="text-yellow-200 font-black">{saveData.coins} 💰</div>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-5 rounded-[1.7rem] text-white font-black text-2xl shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform mb-3"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          onClick={onStart}
        >
          🎮 بزن بریم!
        </button>

        <div className="grid grid-cols-3 gap-2 w-full mb-3">
          <button type="button" className="menu-btn bg-sky-500" onClick={onAquarium}>🐟 آکواریوم</button>
          <button type="button" className="menu-btn bg-amber-500" onClick={onAchievements}>🏆 جام‌ها</button>
          <button type="button" className="menu-btn bg-cyan-600" onClick={onProgress}>📊 پیشرفت</button>
        </div>

        <SupportFab variant="pill" />
        <button type="button" className="mt-2 text-sky-200/80 text-xs underline" onClick={onSupport}>
          راهنمای پشتیبانی
        </button>
      </div>
    </div>
  );
}
