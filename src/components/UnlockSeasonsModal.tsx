import { useState, type FormEvent } from 'react';
import { isAdultGateAnswerCorrect } from '../utils/parentalGate';

interface Props {
  loading: boolean;
  error: string;
  onBuy: () => void;
  onRestore: () => void;
  onContinueFree: () => void;
}

export function UnlockSeasonsModal({ loading, error, onBuy, onRestore, onContinueFree }: Props) {
  const [showAdultGate, setShowAdultGate] = useState(false);
  const [adultAnswer, setAdultAnswer] = useState('');
  const [adultGateError, setAdultGateError] = useState('');

  const requestPurchase = () => {
    setAdultAnswer('');
    setAdultGateError('');
    setShowAdultGate(true);
  };

  const cancelAdultGate = () => {
    setShowAdultGate(false);
    setAdultAnswer('');
    setAdultGateError('');
  };

  const confirmAdultGate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdultGateAnswerCorrect(adultAnswer)) {
      setAdultGateError('پاسخ درست نیست؛ دوباره تلاش کنید.');
      return;
    }

    cancelAdultGate();
    // The only route from this modal to checkout passes through this confirmation.
    onBuy();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" dir="rtl">
      <section className="w-full max-w-sm rounded-[2rem] border border-cyan-200/30 bg-gradient-to-b from-sky-900 to-slate-950 p-6 text-center text-white shadow-2xl">
        <div className="mb-2 text-6xl">🗝️🐠</div>
        <h2 className="mb-2 text-2xl font-black text-amber-300">بازکردن فصل‌های بیشتر</h2>
        <p className="mb-4 text-sm leading-7 text-sky-100">
          چهار فصل اول رایگان‌اند. والدین می‌توانند با یک پرداخت دائمی، فصل‌های ۵ تا ۱۰ را باز کنند. خرید اشتراک ماهانه ندارد و بازی آفلاین هم قابل استفاده است.
        </p>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6">
          <div>✅ بازشدن فصل‌های ۵ تا ۱۰</div>
          <div>✅ فقط یک‌بار پرداخت</div>
          <div>✅ بدون اشتراک ماهانه</div>
          <div>✅ بازیابی خرید از کافه‌بازار</div>
        </div>
        {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
        <button type="button" disabled={loading} onClick={requestPurchase} className="mb-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-green-600 px-4 py-4 text-lg font-black text-white shadow-lg disabled:opacity-60">
          {loading ? 'در حال ارتباط با بازار…' : '🔓 خرید دائمی فصل‌های ۵ تا ۱۰'}
        </button>
        <button type="button" disabled={loading} onClick={onRestore} className="mb-2 w-full rounded-xl border border-cyan-200/30 bg-cyan-900/40 px-4 py-3 font-bold text-cyan-100 disabled:opacity-60">
          والدین: خرید قبلی را بازیابی کنید
        </button>
        <button type="button" disabled={loading} onClick={onContinueFree} className="w-full px-4 py-2 text-sm text-slate-300 underline disabled:opacity-60">
          بازگشت به صفحه شروع
        </button>
      </section>

      {showAdultGate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" dir="rtl">
          <section role="dialog" aria-modal="true" aria-labelledby="adult-gate-title" className="w-full max-w-sm rounded-[2rem] border border-cyan-200/40 bg-gradient-to-b from-sky-800 via-sky-950 to-slate-950 p-6 text-center text-white shadow-2xl">
            <div className="mb-2 text-5xl" aria-hidden="true">🛡️🐬</div>
            <h3 id="adult-gate-title" className="mb-2 text-2xl font-black text-amber-300">تأیید بزرگسال</h3>
            <p className="mb-4 text-sm leading-7 text-sky-100">
              برای باز کردن فصل‌های پولی، لطفاً این سؤال را پاسخ دهید.
            </p>
            <form onSubmit={confirmAdultGate}>
              <label htmlFor="adult-gate-answer" className="mb-3 block text-lg font-bold text-white">
                حاصل ۱۷ × ۳ چند است؟
              </label>
              <input
                id="adult-gate-answer"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                value={adultAnswer}
                onChange={(event) => {
                  setAdultAnswer(event.target.value);
                  if (adultGateError) setAdultGateError('');
                }}
                aria-invalid={Boolean(adultGateError)}
                aria-describedby={adultGateError ? 'adult-gate-error' : undefined}
                className="mb-3 w-full rounded-xl border border-cyan-200/40 bg-slate-900/80 px-4 py-3 text-center text-xl font-bold text-white outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30"
                placeholder="پاسخ عددی"
              />
              {adultGateError && (
                <p id="adult-gate-error" role="alert" className="mb-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">
                  {adultGateError}
                </p>
              )}
              <button type="submit" className="mb-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-green-600 px-4 py-3 font-black text-white shadow-lg">
                تأیید و ادامه
              </button>
              <button type="button" onClick={cancelAdultGate} className="w-full rounded-xl border border-white/15 px-4 py-3 font-bold text-slate-200">
                بعداً
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
