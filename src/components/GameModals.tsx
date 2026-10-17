import type { ReactNode } from 'react';
import type { SaveData } from '../types';
import { SUPPORT_WHATSAPP_DISPLAY } from '../constants';
import { openWhatsAppSupport } from './SupportFab';

interface Props {
  saveData: SaveData;
  maxAvailableTable: number;
  showAquarium: boolean;
  showAchievements: boolean;
  showProgress: boolean;
  showSupport: boolean;
  onCloseAquarium: () => void;
  onCloseAchievements: () => void;
  onCloseProgress: () => void;
  onCloseSupport: () => void;
}

function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-950/95 rounded-t-3xl sm:rounded-3xl p-5 mx-0 sm:mx-4 w-full max-w-md max-h-[85dvh] overflow-y-auto shadow-2xl border border-cyan-400/20"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function GameModals({
  saveData,
  maxAvailableTable,
  showAquarium,
  showAchievements,
  showProgress,
  showSupport,
  onCloseAquarium,
  onCloseAchievements,
  onCloseProgress,
  onCloseSupport,
}: Props) {
  return (
    <>
      {showAquarium && (
        <ModalShell onClose={onCloseAquarium}>
          <h2 className="text-xl font-bold text-white mb-2 text-center">🐟 آکواریوم</h2>
          <p className="text-cyan-200 text-center text-xs mb-3">
            {saveData.aquarium.length} ماهی | 💰 {saveData.coins} سکه
            {saveData.hasSharkPet && ' | 🦈 کوسه‌خالخالی با توئه!'}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {saveData.aquarium.slice(-30).map((fish, i) => (
              <div key={i} className="bg-slate-800/80 rounded-xl p-2 flex items-center justify-center min-h-[50px]">
                <div className="text-2xl">
                  {fish.kind === 'golden' ? '🌟' : fish.kind === 'rare' ? '💎' : '🐟'}
                </div>
              </div>
            ))}
            {saveData.aquarium.length === 0 && (
              <div className="col-span-5 text-center text-sky-300 py-6 text-sm">
                هنوز ماهی نگرفتی! بزن بریم بازی 🎣
              </div>
            )}
          </div>
          <button className="mt-4 w-full py-3 bg-sky-500 text-white rounded-2xl font-bold" onClick={onCloseAquarium}>
            بستن
          </button>
        </ModalShell>
      )}

      {showAchievements && (
        <ModalShell onClose={onCloseAchievements}>
          <h2 className="text-xl font-bold text-white mb-3 text-center">🏆 دستاوردها</h2>
          <div className="space-y-2">
            {saveData.achievements.map(ach => (
              <div
                key={ach.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  ach.unlocked ? 'bg-slate-800/90' : 'bg-slate-900/70 opacity-50'
                }`}
              >
                <span className="text-2xl">{ach.emoji}</span>
                <div className="flex-1">
                  <div className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {ach.title}
                  </div>
                  <div className="text-xs text-sky-300">{ach.description}</div>
                </div>
                {ach.unlocked && <span className="text-green-400 text-lg">✅</span>}
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 bg-sky-500 text-white rounded-2xl font-bold" onClick={onCloseAchievements}>
            بستن
          </button>
        </ModalShell>
      )}

      {showProgress && (
        <ModalShell onClose={onCloseProgress}>
          {(() => {
            const tables = Array.from({ length: 12 }, (_, i) => i + 1).map(table => {
              const stat = saveData.tableStats[String(table)];
              const attempts = Math.max(0, stat?.attempts || 0);
              const correct = Math.min(attempts, Math.max(0, stat?.correct || 0));
              return {
                table,
                stat,
                attempts,
                correct,
                accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
              };
            });
            const availableTables = tables.slice(0, Math.max(1, Math.min(12, maxAvailableTable)));
            const recommendationPriority = (item: typeof tables[number]) => {
              const confidence = item.attempts / (item.attempts + 5);
              const smoothedAccuracy = (item.correct + 2) / (item.attempts + 4);
              return (1 - smoothedAccuracy) * confidence + (1 - confidence) * 0.2;
            };
            // Suggest an available but unpracticed table first. Otherwise blend
            // accuracy with sample size so one early mistake cannot dominate.
            const recommendation =
              availableTables.find(item => item.attempts === 0) ??
              [...availableTables].sort((a, b) => recommendationPriority(b) - recommendationPriority(a))[0];
            const masteredCount = availableTables.filter(item =>
              item.attempts >= 10 && (item.accuracy ?? 0) >= 90
            ).length;
            return (
              <>
                <h2 className="text-xl font-bold text-white mb-1 text-center">📊 پیشرفت یادگیری</h2>
                <p className="text-cyan-300 text-xs text-center mb-1">هر جدول را که بیشتر تمرین کنی، قوی‌تر می‌شی.</p>
                <p className="text-slate-300 text-[11px] text-center mb-4">
                  {masteredCount} از {availableTables.length} جدول به تسلط رسیده
                </p>
                <div className="bg-cyan-950/70 border border-cyan-400/30 rounded-2xl p-3 mb-4">
                  <div className="text-cyan-200 text-xs mb-1">🎯 پیشنهاد تمرین بعدی</div>
                  <div className="text-white font-bold">جدول ×{recommendation.table}</div>
                  <div className="text-cyan-100 text-xs mt-1">
                    {recommendation.attempts
                      ? `دقت فعلی ${recommendation.accuracy}% در ${recommendation.attempts} تمرین است؛ چند دور دیگر تمرین کن.`
                      : 'هنوز این جدول را تمرین نکردی؛ از اینجا شروع کن!'}
                  </div>
                </div>
                <div className="space-y-2">
                  {availableTables.map(({ table, stat, attempts, correct, accuracy }) => {
                    const mastery = accuracy === null
                      ? { label: 'شروع نشده', color: 'text-slate-400' }
                      : attempts >= 10 && accuracy >= 90
                        ? { label: 'مسلط شدی! 🌟', color: 'text-green-300' }
                        : accuracy >= 70
                          ? { label: 'در حال یادگیری', color: 'text-cyan-300' }
                          : { label: 'نیاز به تمرین', color: 'text-amber-300' };
                    const averageTime = attempts && stat
                      ? Math.round((stat.totalResponseTime / attempts) * 10) / 10
                      : null;
                    return (
                      <div key={table} className="bg-slate-800/90 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <span className="text-white font-bold">جدول ×{table}</span>
                          <span className={`font-bold text-xs ${mastery.color}`}>
                            {accuracy === null ? mastery.label : `${accuracy}% • ${mastery.label}`}
                          </span>
                        </div>
                        <div
                          className="h-2 bg-slate-700 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-label={`پیشرفت جدول ضرب ${table}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={accuracy ?? 0}
                        >
                          <div
                            className={`h-full ${accuracy !== null && accuracy >= 90 ? 'bg-gradient-to-r from-cyan-400 to-green-400' : 'bg-cyan-400'}`}
                            style={{ width: `${accuracy ?? 0}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {attempts
                            ? `${attempts} بار تمرین • ${stat?.currentStreak || 0} پاسخ درست پیاپی${averageTime !== null ? ` • میانگین ${averageTime} ثانیه` : ''}`
                            : 'با بازی کردن این جدول را تمرین کن.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="mt-4 w-full py-3 bg-cyan-600 text-white rounded-2xl font-bold" onClick={onCloseProgress}>
                  بستن
                </button>
              </>
            );
          })()}
        </ModalShell>
      )}

      {showSupport && (
        <ModalShell onClose={onCloseSupport}>
          <h2 className="text-xl font-bold text-white mb-3 text-center">💬 پشتیبانی</h2>
          <p className="text-sky-100 text-sm leading-8 text-center mb-4">
            اگر سوال یا مشکلی داشتی، از واتساپ پیام بده.
            <br />
            <span className="text-emerald-300 font-bold tracking-wide" dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>
          </p>
          <button
            type="button"
            className="w-full py-4 rounded-2xl text-white font-extrabold text-lg mb-2"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
            onClick={openWhatsAppSupport}
          >
            باز کردن واتساپ
          </button>
          <button className="w-full py-3 bg-slate-700 text-white rounded-2xl font-bold" onClick={onCloseSupport}>
            بستن
          </button>
        </ModalShell>
      )}
    </>
  );
}
