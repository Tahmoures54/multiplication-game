import { Capacitor, registerPlugin } from '@capacitor/core';

interface BazaarBillingPlugin {
  getPurchaseStatus(): Promise<{ owned: boolean }>;
  refreshPurchaseStatus(): Promise<{ owned: boolean }>;
  purchaseFullUnlock(): Promise<{ owned: boolean }>;
  restorePurchases(): Promise<{ owned: boolean }>;
}

const BazaarBilling = registerPlugin<BazaarBillingPlugin>('BazaarBilling');

export const FULL_UNLOCK_PRODUCT_ID = 'fishmath_full_unlock';
const RECOVERY_ATTEMPTS = 2;
const RECOVERY_DELAY_MS = 700;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unavailableMessage(): string {
  return 'پرداخت و بازیابی خرید فقط در نسخه اندروید نصب‌شده از کافه‌بازار فعال است.';
}

async function refreshWithRetries(): Promise<boolean> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RECOVERY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await wait(RECOVERY_DELAY_MS);
    try {
      const result = await BazaarBilling.refreshPurchaseStatus();
      return result.owned === true;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('تأیید وضعیت خرید از کافه‌بازار ممکن نشد. دوباره تلاش کنید.');
}

export const bazaarBilling = {
  isNative: () => Capacitor.isNativePlatform(),

  /**
   * Startup uses one fresh inventory query, then falls back to a previously
   * verified local entitlement if Bazaar is temporarily unavailable.
   */
  async status(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    let cached = false;
    try {
      cached = (await BazaarBilling.getPurchaseStatus()).owned === true;
    } catch {
      // Continue to fresh inventory reconciliation below.
    }

    try {
      const result = await BazaarBilling.refreshPurchaseStatus();
      return result.owned === true;
    } catch {
      return cached;
    }
  },

  /**
   * Check ownership before opening checkout to avoid charging twice if the
   * previous activity result was lost. If verification cannot be refreshed,
   * do not launch another payment attempt.
   */
  async purchase(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) throw new Error(unavailableMessage());

    let alreadyOwned: boolean;
    try {
      alreadyOwned = await refreshWithRetries();
    } catch {
      throw new Error(
        'وضعیت خرید قبلی از کافه‌بازار قابل بررسی نیست. برای جلوگیری از پرداخت تکراری، فعلاً خرید جدید شروع نشد؛ اتصال را بررسی و دوباره تلاش کنید.',
      );
    }
    if (alreadyOwned) return true;

    try {
      const result = await BazaarBilling.purchaseFullUnlock();
      if (result.owned === true) return true;
    } catch (purchaseError) {
      // The Bazaar checkout may have completed even if Android did not return
      // the activity result. Reconcile inventory before showing a failure.
      try {
        if (await refreshWithRetries()) return true;
      } catch {
        // Preserve a clear recovery instruction below; never auto-charge again.
      }
      const detail = purchaseError instanceof Error ? purchaseError.message : '';
      throw new Error(
        detail
          ? `${detail} اگر مبلغی کسر شده، دوباره پرداخت نکنید؛ «بازیابی خرید» را امتحان کنید.`
          : 'نتیجه خرید هنوز تأیید نشده است. دوباره پرداخت نکنید؛ «بازیابی خرید» را امتحان کنید.',
      );
    }

    // A false/empty callback can also mean the checkout result was lost.
    try {
      if (await refreshWithRetries()) return true;
    } catch {
      // Fall through to the same safe recovery guidance.
    }
    throw new Error(
      'خرید هنوز در کافه‌بازار تأیید نشده است. اگر مبلغی کسر شده، دوباره پرداخت نکنید؛ «بازیابی خرید» را امتحان کنید.',
    );
  },

  /**
   * Refresh inventory rather than trusting the startup snapshot. A verified
   * local entitlement remains usable offline if Bazaar cannot be reached.
   */
  async restore(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) throw new Error(unavailableMessage());

    let cached = false;
    try {
      cached = (await BazaarBilling.getPurchaseStatus()).owned === true;
    } catch {
      // Try a live inventory refresh.
    }

    try {
      return await refreshWithRetries();
    } catch (error) {
      if (cached) return true;
      throw error instanceof Error
        ? error
        : new Error('بازیابی خرید انجام نشد. اتصال به کافه‌بازار را بررسی کنید و دوباره تلاش کنید.');
    }
  },
};
