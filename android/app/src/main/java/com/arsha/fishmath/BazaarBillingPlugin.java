package com.arsha.fishmath;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

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
    private static final long INVENTORY_TIMEOUT_MS = 12000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private BillingClient billingClient;
    private SharedPreferences preferences;
    private PluginCall pendingPurchase;
    private PluginCall pendingInventoryCall;
    private Inventory latestInventory;
    private boolean inventoryReady = false;
    private Runnable inventoryTimeout;

    @Override
    public void load() {
        preferences = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        createBillingClient();
    }

    private void createBillingClient() {
        billingClient = new BillingClient(getActivity().getActivityResultRegistry(), getContext());
        billingClient.setGlobalAutoConsume(false);
        billingClient.setOnBillingResultListener(new OnBillingResultListener() {
            @Override
            public void onBillingSuccess(Purchase purchase) {
                if (purchase == null || !PRODUCT_ID.equals(purchase.getSku()) || !isVerifiedPurchase(purchase)) {
                    rejectPendingPurchase("خرید توسط کافه‌بازار تأیید نشد. اگر مبلغی کسر شده، دوباره پرداخت نکنید و بازیابی خرید را امتحان کنید.");
                    return;
                }

                // This is a permanent/non-consumable product: never consume it.
                // Commit the entitlement before reporting success to the WebView.
                if (!preferences.edit().putBoolean(OWNED_KEY, true).commit()) {
                    rejectPendingPurchase("خرید تأیید شد اما ذخیره آن کامل نشد. دوباره پرداخت نکنید؛ چند لحظه بعد «بازیابی خرید» را بزنید.");
                    return;
                }
                resolvePendingPurchase(true);
            }

            @Override
            public void onConsumeFinished(Purchase purchase, boolean success) {
                // fishmath_full_unlock is non-consumable and must never be consumed.
            }

            @Override
            public void onBillingStatus(int code) {
                if (code == TableCodes.SETUP_SUCCESS) return;
                String message = "اتصال به پرداخت کافه‌بازار برقرار نشد (کد " + code + ").";
                rejectPendingPurchase(message);
                rejectPendingInventory(message);
            }

            @Override
            public void onQueryInventoryFinished(Inventory inventory) {
                latestInventory = inventory;
                inventoryReady = inventory != null;
                if (inventory == null) {
                    rejectPendingInventory("پاسخ موجودی کافه‌بازار معتبر نبود. دوباره تلاش کنید.");
                    return;
                }

                Purchase owned = inventory.getPurchase(PRODUCT_ID);
                boolean verified = owned != null && isVerifiedPurchase(owned);
                // A successful inventory response is authoritative, including a
                // missing purchase (e.g. a refunded/revoked entitlement).
                if (!preferences.edit().putBoolean(OWNED_KEY, verified).commit()) {
                    rejectPendingInventory("وضعیت خرید دریافت شد اما ذخیره آن کامل نشد. دوباره تلاش کنید.");
                    return;
                }
                resolvePendingInventory(verified);
            }
        });
    }

    @PluginMethod
    public void getPurchaseStatus(PluginCall call) {
        JSObject result = new JSObject();
        boolean owned = preferences != null && preferences.getBoolean(OWNED_KEY, false);
        result.put("owned", owned);
        call.resolve(result);
    }

    /**
     * Recreates the billing connection so the SDK performs a fresh inventory
     * query. This is used for purchase recovery and restore; the local cache is
     * only a fallback when Bazaar cannot be reached.
     */
    @PluginMethod
    public void refreshPurchaseStatus(PluginCall call) {
        if (pendingPurchase != null || pendingInventoryCall != null) {
            call.reject("یک درخواست پرداخت یا بازیابی در حال انجام است.");
            return;
        }
        if (BuildConfig.BAZAAR_RSA_PUBLIC_KEY == null || BuildConfig.BAZAAR_RSA_PUBLIC_KEY.trim().isEmpty()) {
            call.reject("کلید عمومی پرداخت کافه‌بازار در این نسخه تنظیم نشده است.");
            return;
        }

        pendingInventoryCall = call;
        inventoryReady = false;
        latestInventory = null;
        if (inventoryTimeout != null) mainHandler.removeCallbacks(inventoryTimeout);
        inventoryTimeout = () -> rejectPendingInventory(
            "پاسخ کافه‌بازار دریافت نشد. اتصال اینترنت و نصب بودن کافه‌بازار را بررسی کنید و دوباره تلاش کنید."
        );
        mainHandler.postDelayed(inventoryTimeout, INVENTORY_TIMEOUT_MS);

        try {
            if (billingClient != null) {
                billingClient.endConnection();
                billingClient = null;
            }
            createBillingClient();
        } catch (Exception error) {
            rejectPendingInventory("برقراری اتصال جدید با کافه‌بازار ناموفق بود. دوباره تلاش کنید.");
        }
    }

    @PluginMethod
    public void purchaseFullUnlock(PluginCall call) {
        if (pendingPurchase != null || pendingInventoryCall != null) {
            call.reject("یک درخواست خرید یا بازیابی در حال انجام است.");
            return;
        }
        if (BuildConfig.BAZAAR_RSA_PUBLIC_KEY == null || BuildConfig.BAZAAR_RSA_PUBLIC_KEY.trim().isEmpty()) {
            call.reject("کلید عمومی پرداخت کافه‌بازار هنوز در تنظیمات بیلد ثبت نشده است.");
            return;
        }
        if (preferences.getBoolean(OWNED_KEY, false)) {
            resolve(call, true);
            return;
        }
        if (billingClient == null) {
            call.reject("اتصال به پرداخت آماده نیست. برنامه را دوباره باز کنید.");
            return;
        }
        pendingPurchase = call;
        billingClient.launchBilling(PRODUCT_ID, BillingHelper.ITEM_TYPE_INAPP, "fishmath-full-unlock", false);
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        // Force a fresh Bazaar inventory lookup rather than returning a stale
        // inventory captured during app startup.
        refreshPurchaseStatus(call);
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

    private void resolvePendingInventory(boolean owned) {
        if (pendingInventoryCall == null) return;
        PluginCall call = pendingInventoryCall;
        pendingInventoryCall = null;
        clearInventoryTimeout();
        resolve(call, owned);
    }

    private void rejectPendingInventory(String message) {
        if (pendingInventoryCall == null) return;
        PluginCall call = pendingInventoryCall;
        pendingInventoryCall = null;
        clearInventoryTimeout();
        call.reject(message);
    }

    private void clearInventoryTimeout() {
        if (inventoryTimeout != null) {
            mainHandler.removeCallbacks(inventoryTimeout);
            inventoryTimeout = null;
        }
    }

    private void resolve(PluginCall call, boolean owned) {
        JSObject result = new JSObject();
        result.put("owned", owned);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        clearInventoryTimeout();
        rejectPendingInventory("برنامه بسته شد پیش از پایان بازیابی خرید.");
        if (billingClient != null) {
            billingClient.endConnection();
            billingClient = null;
        }
        super.handleOnDestroy();
    }
}
