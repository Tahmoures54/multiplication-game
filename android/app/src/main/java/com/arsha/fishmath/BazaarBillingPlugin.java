package com.arsha.fishmath;

import android.content.SharedPreferences;

import com.farasource.billing.BillingClient;
import com.farasource.billing.BillingHelper;
import com.farasource.billing.util.TableCodes;
import com.farasource.billing.communication.OnBillingResultListener;
import com.farasource.billing.util.Inventory;
import com.farasource.billing.util.Purchase;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;


@CapacitorPlugin(name = "BazaarBilling")
public class BazaarBillingPlugin extends Plugin {
    private static final String PRODUCT_ID = "fishmath_full_unlock";
    private static final String PREFS = "fishmath_bazaar_entitlement";
    private static final String OWNED_KEY = "full_unlock_owned";

    private BillingClient billingClient;
    private SharedPreferences preferences;
    private PluginCall pendingPurchase;
    private Inventory latestInventory;
    private boolean inventoryReady = false;

    @Override
    public void load() {
        preferences = getContext().getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE);
        billingClient = new BillingClient(getActivity().getActivityResultRegistry(), getContext());
        billingClient.setGlobalAutoConsume(false);
        billingClient.setOnBillingResultListener(new OnBillingResultListener() {
            @Override
            public void onBillingSuccess(Purchase purchase) {
                if (purchase == null || !PRODUCT_ID.equals(purchase.getSku()) || !isVerifiedPurchase(purchase)) {
                    rejectPendingPurchase("خرید توسط کافه‌بازار تأیید نشد.");
                    return;
                }
                // Permanent unlock: deliberately do not consume this purchase.
                preferences.edit().putBoolean(OWNED_KEY, true).apply();
                resolvePendingPurchase(true);
            }

            @Override
            public void onConsumeFinished(Purchase purchase, boolean success) {
                // This product is non-consumable and must never be consumed.
            }

            @Override
            public void onBillingStatus(int code) {
                if (code != TableCodes.SETUP_SUCCESS) {
                    rejectPendingPurchase("اتصال به پرداخت کافه‌بازار برقرار نشد (کد " + code + ").");
                }
            }

            @Override
            public void onQueryInventoryFinished(Inventory inventory) {
                latestInventory = inventory;
                inventoryReady = true;
                Purchase owned = inventory == null ? null : inventory.getPurchase(PRODUCT_ID);
                boolean verified = owned != null && isVerifiedPurchase(owned);
                if (verified) {
                    preferences.edit().putBoolean(OWNED_KEY, true).apply();
                }
            }
        });
    }

    @PluginMethod
    public void getPurchaseStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("owned", preferences != null && preferences.getBoolean(OWNED_KEY, false));
        call.resolve(result);
    }

    @PluginMethod
    public void purchaseFullUnlock(PluginCall call) {
        if (pendingPurchase != null) {
            call.reject("یک درخواست خرید در حال انجام است.");
            return;
        }
        if (BuildConfig.BAZAAR_RSA_PUBLIC_KEY.trim().isEmpty()) {
            call.reject("کلید عمومی پرداخت کافه‌بازار هنوز در تنظیمات بیلد ثبت نشده است.");
            return;
        }
        if (preferences.getBoolean(OWNED_KEY, false)) {
            resolve(call, true);
            return;
        }
        pendingPurchase = call;
        billingClient.launchBilling(PRODUCT_ID, BillingHelper.ITEM_TYPE_INAPP, "fishmath-full-unlock", false);
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (preferences.getBoolean(OWNED_KEY, false)) {
            resolve(call, true);
            return;
        }
        if (inventoryReady) {
            Purchase owned = latestInventory == null ? null : latestInventory.getPurchase(PRODUCT_ID);
            boolean verified = owned != null && isVerifiedPurchase(owned);
            if (verified) preferences.edit().putBoolean(OWNED_KEY, true).apply();
            resolve(call, verified);
            return;
        }
        call.reject("موجودی بازار هنوز آماده نیست. چند لحظه صبر کنید و دوباره بازیابی را بزنید.");
    }

    private boolean isVerifiedPurchase(Purchase purchase) {
        if (purchase == null || purchase.getPurchaseState() != 0) return false;
        if (!PRODUCT_ID.equals(purchase.getSku())) return false;
        String key = BuildConfig.BAZAAR_RSA_PUBLIC_KEY;
        if (key == null || key.trim().isEmpty()) return false;
        try {
            return BillingClient.verifyPurchase(purchase, key.trim());
        } catch (Exception ignored) {
            return false;
        }
    }

    private void resolvePendingPurchase(boolean owned) {
        if (pendingPurchase == null) return;
        PluginCall call = pendingPurchase;
        pendingPurchase = null;
        if (owned) resolve(call, true);
        else call.reject("خرید معتبر تشخیص داده نشد.");
    }

    private void rejectPendingPurchase(String message) {
        if (pendingPurchase == null) return;
        PluginCall call = pendingPurchase;
        pendingPurchase = null;
        call.reject(message);
    }

    private void resolve(PluginCall call, boolean owned) {
        JSObject result = new JSObject();
        result.put("owned", owned);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null) {
            billingClient.endConnection();
            billingClient = null;
        }
        super.handleOnDestroy();
    }
}
