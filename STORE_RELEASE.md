# 🚀 راهنمای انتشار در گوگل‌پلی

## مشخصات برنامه
| مورد | مقدار |
|------|--------|
| نام | ماهیگیری جدول ضرب |
| Package ID | `com.arsha.fishmath` |
| نسخه | `1.2.0` (versionCode = 3) |
| حداقل اندروید | 5.1 (API 22) |
| هدف | API 36 |
| دسته پیشنهادی | آموزش / بازی آموزشی کودکان |

---

## ۱. ساخت Keystore (یک‌بار برای همیشه)

```bash
keytool -genkey -v -keystore fishmath-release.keystore -alias fishmath -keyalg RSA -keysize 2048 -validity 10000
```

سپس فایل `android/keystore.properties` بسازید:

```properties
storeFile=../fishmath-release.keystore
storePassword=رمز_شما
keyAlias=fishmath
keyPassword=رمز_شما
```

⚠️ این فایل و keystore را **هرگز** در گیت commit نکنید.

---

## ۲. بیلد برای گوگل‌پلی (AAB)

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

فایل خروجی:
`android/app/build/outputs/bundle/release/app-release.aab`

یا از GitHub Actions:
- Actions → Build Android → Run workflow → انتخاب `bundle`

---

## ۳. متن‌های فروشگاه (کپی کنید)

### عنوان کوتاه (حداکثر ۳۰ کاراکتر)
```
ماهیگیری جدول ضرب
```

### توضیح کوتاه (حداکثر ۸۰ کاراکتر)
```
بازی آموزشی ضرب با تم ماهیگیری — مخصوص کودکان
```

### توضیح کامل
```
🎣 بازی ماهیگیری جدول ضرب

یک بازی آموزشی سرگرم‌کننده برای کودکان که تمرین جدول ضرب را به ماجراجویی ماهیگیری تبدیل می‌کند!

✨ ویژگی‌ها:
• تجربه تمام‌صفحه با دنیای دریایی زنده
• پاسخ فقط با انتخاب گزینه — بدون تایپ و بدون کیپد
• ۱۰ فصل با سختی پیشرونده
• فصل‌های بصری بهار، تابستان، پاییز و زمستان
• کوسه‌خالخالی بامزه و سیستم باس
• قدرت‌های ویژه، دستاوردها و آکواریوم شخصی
• موسیقی ملایم پس‌زمینه
• انتخاب تطبیقی سؤال‌ها بر اساس نقاط ضعف
• صفحه پیشرفت یادگیری برای جدول‌های ×1 تا ×12
• کاملاً آفلاین و بدون تبلیغات

مناسب برای کودکان ۷ تا ۱۲ سال.
پشتیبانی واتساپ: +989160684552
```

### کلمات کلیدی پیشنهادی
```
جدول ضرب، ریاضی کودکان، بازی آموزشی، ماهیگیری، یادگیری ضرب
```

---

## ۴. تصاویر مورد نیاز گوگل‌پلی

| نوع | اندازه |
|-----|--------|
| آیکون برنامه | 512×512 PNG |
| تصویر ویژه (Feature Graphic) | 1024×500 |
| اسکرین‌شات موبایل | حداقل ۲ عدد (۱۶:۹ یا ۹:۱۶) |
| اسکرین‌شات تبلت (اختیاری) | ۷ یا ۱۰ اینچ |

---

## ۵. رتبه‌بندی محتوا
- مخاطب: Everyone / مناسب کودکان
- بدون خشونت واقعی، بدون خرید درون‌برنامه‌ای اجباری، بدون تبلیغات شخص ثالث

## ۶. حریم خصوصی
متن کامل در فایل `PRIVACY_POLICY.md` است.  
لینک آن را در کنسول گوگل‌پلی قرار دهید (مثلاً روی گیت‌هاب یا سایت خودتان).


## Fish Math 1.2.0 Release Notes

- Full-screen ocean world; HUD and answers overlay the live canvas.
- Children now always answer by tapping a choice. Numeric typing and the keypad are gone.
- Developer/contact details were removed. Support is WhatsApp +989160684552.
- Pause is a full-screen overlay. Duplicate progress button on the start screen is gone.
- Android versionCode: 3; versionName: 1.2.0.

## Fish Math 1.1.0 Release Notes

- Adaptive question selection now prioritizes weaker multiplication tables.
- Added learning progress view for tables ×1 through ×12.
- Added save schema versioning and migration-safe defaults.
- Hardened achievement and power-up persistence.
- Fixed chain-question display so the intermediate result and final answer are unambiguous.
- Android build target updated to API 36 for the August 31, 2026 Google Play requirement.
- Android versionCode: 2; versionName: 1.1.0.

Before upload, create a release keystore and verify the signed AAB on a physical Android device. Google Play currently requires new apps and updates to target Android 16 (API 36) or higher starting August 31, 2026.
