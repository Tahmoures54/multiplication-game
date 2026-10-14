interface Props {
  loading: boolean;
  error: string;
  onBuy: () => void;
  onRestore: () => void;
  onContinueFree: () => void;
}

export function UnlockSeasonsModal({ loading, error, onBuy, onRestore, onContinueFree }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" dir="rtl">
      <section className="w-full max-w-sm rounded-[2rem] border border-cyan-200/30 bg-gradient-to-b from-sky-900 to-slate-950 p-6 text-center text-white shadow-2xl">
        <div className="mb-2 text-6xl">🗝️🐠</div>
        <h2 className="mb-2 text-2xl font-black text-amber-300">دریای فصل‌های تازه!</h2>
        <p className="mb-4 text-sm leading-7 text-sky-100">
          چهار فصل اول رایگان است. با یک خرید دائمی، فصل‌های ۵ تا ۱۰ را برای همیشه باز کن و هر وقت خواستی حتی آفلاین بازی کن.
        </p>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6">
          <div>✅ بازشدن فصل‌های ۵ تا ۱۰</div>
          <div>✅ فقط یک‌بار پرداخت</div>
          <div>✅ بدون اشتراک ماهانه</div>
          <div>✅ بازیابی خرید از کافه‌بازار</div>
        </div>
        {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
        <button type="button" disabled={loading} onClick={onBuy} className="mb-2 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-green-600 px-4 py-4 text-lg font-black text-white shadow-lg disabled:opacity-60">
          {loading ? 'در حال ارتباط با بازار…' : '🔓 خرید و بازکردن همه فصل‌ها'}
        </button>
        <button type="button" disabled={loading} onClick={onRestore} className="mb-2 w-full rounded-xl border border-cyan-200/30 bg-cyan-900/40 px-4 py-3 font-bold text-cyan-100 disabled:opacity-60">
          قبلاً خریده‌ام؛ بازیابی خرید
        </button>
        <button type="button" disabled={loading} onClick={onContinueFree} className="w-full px-4 py-2 text-sm text-slate-300 underline disabled:opacity-60">
          بازگشت به صفحه شروع
        </button>
      </section>
    </div>
  );
}
