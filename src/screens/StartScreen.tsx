import type { SaveData } from '../types';
import { SupportFab } from '../components/SupportFab';

interface Props {
  saveData: SaveData;
  onStart: () => void;
  onAquarium: () => void;
  onAchievements: () => void;
  onProgress: () => void;
  onSupport: () => void;
  onUnlock: () => void;
  hasFullUnlock: boolean;
}

export function StartScreen({
  saveData,
  onStart,
  onAquarium,
  onAchievements,
  onProgress,
  onUnlock,
  hasFullUnlock,
}: Props) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-950/15 via-transparent to-slate-950/65" />

      <div className="relative z-10 mx-auto flex max-h-full w-full max-w-md flex-col items-center overflow-y-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-[max(1.25rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="animate-fish-bob mb-1 text-6xl drop-shadow-lg sm:mb-2 sm:text-7xl" aria-hidden="true">🎣</div>
        <h1 className="mb-1 text-center text-2xl font-black text-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] sm:text-3xl">
          ماهیگیری جدول ضرب
        </h1>
        <p className="mb-1 text-center text-sm text-sky-100 drop-shadow">
          یکی از گزینه‌ها را لمس کن و ماهی بگیر!
        </p>
        <p className="mb-3 text-center text-xs font-semibold text-cyan-100/90 drop-shadow sm:mb-4">
          با همکاری: دانش‌آموز سید علی موسوی از شهر اسیر
        </p>

        <div className="mb-3 grid w-full grid-cols-3 gap-2 sm:mb-4">
          <div className="hud-chip py-2 text-center">
            <div className="hud-label">بهترین</div>
            <div className="font-black text-amber-300">{saveData.highScore} ⭐</div>
          </div>
          <div className="hud-chip py-2 text-center">
            <div className="hud-label">درست‌ها</div>
            <div className="font-black text-emerald-300">{saveData.totalCorrect} ✅</div>
          </div>
          <div className="hud-chip py-2 text-center">
            <div className="hud-label">سکه‌ها</div>
            <div className="font-black text-yellow-200">{saveData.coins} 💰</div>
          </div>
        </div>

        <button
          type="button"
          className="mb-2 w-full rounded-[1.5rem] py-4 text-xl font-black text-white shadow-lg shadow-emerald-500/35 transition-transform active:scale-[0.98] sm:mb-3 sm:py-5 sm:text-2xl"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          onClick={onStart}
        >
          🎮 بزن بریم!
        </button>

        <div className="mb-3 grid w-full grid-cols-3 gap-2 sm:mb-4">
          <button type="button" className="menu-btn bg-sky-500" onClick={onAquarium}>🐟 آکواریوم</button>
          <button type="button" className="menu-btn bg-amber-500" onClick={onAchievements}>🏆 جام‌ها</button>
          <button type="button" className="menu-btn bg-cyan-600" onClick={onProgress}>📊 پیشرفت</button>
        </div>

        <button
          type="button"
          onClick={onUnlock}
          className="mb-3 w-full rounded-xl border border-amber-300/35 bg-slate-950/20 py-2.5 text-xs font-bold text-amber-100/90 transition-colors active:bg-amber-400/15 sm:text-sm"
        >
          {hasFullUnlock ? '✅ همه فصل‌ها باز هستند' : '🔓 بازکردن دائمی فصل‌های ۵ تا ۱۰'}
        </button>

        <SupportFab variant="pill" />
      </div>
    </div>
  );
}
