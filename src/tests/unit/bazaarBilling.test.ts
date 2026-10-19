import test from 'node:test';
import assert from 'node:assert/strict';
import { createBazaarBilling } from '../../services/bazaarBilling.ts';

type Result = { owned: boolean };
type Plugin = {
  getPurchaseStatus: () => Promise<Result>;
  refreshPurchaseStatus: () => Promise<Result>;
  purchaseFullUnlock: () => Promise<Result>;
  restorePurchases: () => Promise<Result>;
};

function makeHarness(overrides: Partial<Plugin> = {}) {
  const calls = { get: 0, refresh: 0, purchase: 0, restore: 0, waits: 0 };
  const plugin: Plugin = {
    getPurchaseStatus: async () => { calls.get += 1; return { owned: false }; },
    refreshPurchaseStatus: async () => { calls.refresh += 1; return { owned: false }; },
    purchaseFullUnlock: async () => { calls.purchase += 1; return { owned: true }; },
    restorePurchases: async () => { calls.restore += 1; return { owned: false }; },
    ...overrides,
  };
  const billing = createBazaarBilling({
    plugin,
    isNativePlatform: () => true,
    wait: async () => { calls.waits += 1; },
  });
  return { billing, calls };
}

test('purchase does not open checkout when Bazaar inventory cannot be checked', async () => {
  const { billing, calls } = makeHarness({
    refreshPurchaseStatus: async () => { calls.refresh += 1; throw new Error('offline'); },
  });
  await assert.rejects(billing.purchase(), /برای جلوگیری از پرداخت تکراری/);
  assert.equal(calls.refresh, 2);
  assert.equal(calls.purchase, 0);
});

test('purchase treats a rejected checkout with unresolved inventory as uncertain and advises restore', async () => {
  const { billing, calls } = makeHarness({
    purchaseFullUnlock: async () => { calls.purchase += 1; throw new Error('activity result lost'); },
  });
  await assert.rejects(billing.purchase(), /دوباره پرداخت نکنید.*بازیابی خرید/);
  assert.equal(calls.purchase, 1);
  assert.equal(calls.refresh, 2);
});

test('purchase treats a false checkout result as unconfirmed rather than retrying checkout', async () => {
  const { billing, calls } = makeHarness({
    purchaseFullUnlock: async () => { calls.purchase += 1; return { owned: false }; },
  });
  await assert.rejects(billing.purchase(), /خرید هنوز.*دوباره پرداخت نکنید/);
  assert.equal(calls.purchase, 1);
  assert.equal(calls.refresh, 2);
});

test('purchase reconciles inventory after a lost checkout result and grants success only when owned', async () => {
  const { billing, calls } = makeHarness({
    purchaseFullUnlock: async () => { calls.purchase += 1; throw new Error('activity result lost'); },
    refreshPurchaseStatus: async () => {
      calls.refresh += 1;
      return { owned: calls.refresh >= 2 };
    },
  });
  assert.equal(await billing.purchase(), true);
  assert.equal(calls.purchase, 1);
  assert.equal(calls.refresh, 2);
});

test('purchase avoids duplicate checkout when inventory already owns the non-consumable product', async () => {
  const { billing, calls } = makeHarness({
    refreshPurchaseStatus: async () => { calls.refresh += 1; return { owned: true }; },
  });
  assert.equal(await billing.purchase(), true);
  assert.equal(calls.purchase, 0);
});

test('restore after reinstall can recover ownership from fresh Bazaar inventory', async () => {
  const { billing, calls } = makeHarness({
    getPurchaseStatus: async () => { calls.get += 1; return { owned: false }; },
    refreshPurchaseStatus: async () => { calls.refresh += 1; return { owned: true }; },
  });
  assert.equal(await billing.restore(), true);
  assert.equal(calls.get, 1);
  assert.equal(calls.refresh, 1);
});

test('billing operations refuse checkout on non-native platforms', async () => {
  const { calls } = makeHarness();
  const billing = createBazaarBilling({
    plugin: {
      getPurchaseStatus: async () => ({ owned: false }),
      refreshPurchaseStatus: async () => ({ owned: false }),
      purchaseFullUnlock: async () => { calls.purchase += 1; return { owned: true }; },
      restorePurchases: async () => ({ owned: false }),
    },
    isNativePlatform: () => false,
    wait: async () => {},
  });
  assert.equal(billing.isNative(), false);
  assert.equal(await billing.status(), false);
  await assert.rejects(billing.purchase(), /فقط در نسخه اندروید/);
  assert.equal(calls.purchase, 0);
});
