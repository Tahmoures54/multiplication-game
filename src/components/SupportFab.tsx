import { SUPPORT_WHATSAPP_DISPLAY, SUPPORT_WHATSAPP_URL } from '../constants';

interface Props {
  variant?: 'fab' | 'button' | 'pill';
}

export function openWhatsAppSupport() {
  window.open(SUPPORT_WHATSAPP_URL, '_blank', 'noopener,noreferrer');
}

export function SupportFab({ variant = 'fab' }: Props) {
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={openWhatsAppSupport}
        className="w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}
      >
        پشتیبانی واتساپ
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={openWhatsAppSupport}
        className="w-full py-3 rounded-2xl text-white font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      >
        <span className="text-lg">💬</span>
        پشتیبانی واتساپ · {SUPPORT_WHATSAPP_DISPLAY}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openWhatsAppSupport}
      aria-label="پشتیبانی واتساپ"
      className="fixed z-40 left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] w-14 h-14 rounded-full shadow-xl active:scale-95 transition-transform flex items-center justify-center text-2xl"
      style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
    >
      💬
    </button>
  );
}
