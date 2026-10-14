import { Capacitor, registerPlugin } from '@capacitor/core';

interface BazaarBillingPlugin {
  getPurchaseStatus(): Promise<{ owned: boolean }>;
  purchaseFullUnlock(): Promise<{ owned: boolean }>;
  restorePurchases(): Promise<{ owned: boolean }>;
}

const BazaarBilling = registerPlugin<BazaarBillingPlugin>('BazaarBilling');

export const FULL_UNLOCK_PRODUCT_ID = 'fishmath_full_unlock';

export const bazaarBilling = {
  isNative: () => Capacitor.isNativePlatform(),
  async status(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const result = await BazaarBilling.getPurchaseStatus();
    return result.owned === true;
  },
  async purchase(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('خرید درون‌برنامه‌ای فقط در نسخه اندروید نصب‌شده از کافه‌بازار فعال است.');
    }
    const result = await BazaarBilling.purchaseFullUnlock();
    return result.owned === true;
  },
  async restore(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('بازیابی خرید فقط در نسخه اندروید امکان‌پذیر است.');
    }
    const result = await BazaarBilling.restorePurchases();
    return result.owned === true;
  },
};
