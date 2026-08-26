// ===== ثوابت بازی ماهیگیری جدول ضرب =====

export const TOTAL_SEASONS = 10;
export const EPISODES_PER_SEASON = 10;
export const MIN_FACTOR = 1;
export const MAX_FACTOR = 12;
export const INITIAL_LIVES = 4; // یک جان اضافه‌تر
export const BASE_TIME_LIMIT = 18; // زمان بیشتر
export const HINT_PENALTY = 2;

export const FISH_PALETTE: [string, string][] = [
  ["#fb7185", "#be123c"],
  ["#f97316", "#c2410c"],
  ["#22c55e", "#15803d"],
  ["#60a5fa", "#1d4ed8"],
  ["#a78bfa", "#6d28d9"],
  ["#facc15", "#a16207"],
  ["#2dd4bf", "#0f766e"],
  ["#f472b6", "#db2777"],
  ["#34d399", "#059669"],
  ["#818cf8", "#4f46e5"],
];

// ماهی‌های نادر
export const RARE_FISH_PALETTE: [string, string][] = [
  ["#ffd700", "#b8860b"],
  ["#ff69b4", "#c71585"],
  ["#00ffff", "#008b8b"],
];

export const CHEER_TEXTS = [
  "آفرین! عالی بود! 🎉",
  "تو یه نابغه‌ای! 🧠",
  "دمت گرم! ادامه بده! 💪",
  "واو! ماهی خوشگل گرفتی! 🐟",
  "فوق‌العاده! یک قدم جلوتر! 🚀",
  "عالی! بهت افتخار می‌کنم! ⭐",
  "خیلی باهوشی! 🌟",
  "محشره! ادامه بده قهرمان! 🏆",
  "ایول! حرفه‌ای شدی! 🎯",
];

export const OOPS_TEXTS = [
  "اشکالی نداره! دوباره تلاش کن! 💪",
  "نزدیک بود! دفعه بعد می‌تونی! 🤞",
  "عیبی نداره، تمرین یعنی پیشرفت! 📚",
  "کمی سخت بود، ولی تو می‌تونی! 🌟",
  "غم نخور! بزن بریم! 🚀",
];

export const CONFETTI_COLORS = [
  "#fb7185", "#f59e0b", "#22c55e", "#60a5fa", "#a78bfa", "#facc15",
  "#ec4899", "#14b8a6", "#f97316",
];

// پیام‌های کوسه‌خالخالی
export const SHARK_MESSAGES = [
  "سلام رفیق! من کوسه‌خالخالی‌ام! 🦈",
  "واو! تو فوق‌العاده‌ای! 🌟",
  "من عاشق ریاضی‌ام، مثل تو! 🧮",
  "ادامه بده قهرمان! من بهت ایمان دارم! 💪",
  "بیا با هم ماهی بگیریم! 🐟",
  "تو بهترین ماهی‌گیر دنیایی! 🎣",
  "هاهاها! خیلی باحالی! 😄",
  "من از عمق دریا اومدم تا تو رو ببینم! 🌊",
  "چه کمبوی خفنی! ادامه بده! 🔥",
  "تو ستاره دریایی منی! ⭐",
];

// شکلک‌های کوسه
export const SHARK_EXPRESSIONS: Array<'wink' | 'tongue' | 'laugh' | 'happy' | 'cool'> = [
  'wink', 'tongue', 'laugh', 'happy', 'cool'
];

// دستاوردهای اولیه
export const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_fish', title: 'اولین ماهی', description: 'اولین ماهی رو بگیر!', emoji: '🐟', unlocked: false },
  { id: 'combo_5', title: 'کمبوی ۵', description: '۵ جواب درست پشت سر هم', emoji: '🔥', unlocked: false },
  { id: 'combo_10', title: 'کمبوی ۱۰', description: '۱۰ جواب درست پشت سر هم', emoji: '💥', unlocked: false },
  { id: 'season_1', title: 'فصل ۱ تمام!', description: 'فصل ۱ رو تکمیل کن', emoji: '📺', unlocked: false },
  { id: 'season_5', title: 'نصف راه!', description: 'فصل ۵ رو تکمیل کن', emoji: '🏅', unlocked: false },
  { id: 'season_10', title: 'قهرمان!', description: 'همه فصل‌ها رو تکمیل کن', emoji: '🏆', unlocked: false },
  { id: 'score_100', title: 'صد امتیاز!', description: 'به ۱۰۰ امتیاز برس', emoji: '💯', unlocked: false },
  { id: 'score_500', title: 'پانصدتایی!', description: 'به ۵۰۰ امتیاز برس', emoji: '🌟', unlocked: false },
  { id: 'shark_friend', title: 'دوست کوسه', description: 'کوسه‌خالخالی رو ببین!', emoji: '🦈', unlocked: false },
  { id: 'boss_defeat', title: 'غول‌کش!', description: 'اولین باس رو شکست بده', emoji: '👹', unlocked: false },
  { id: 'aquarium_10', title: 'آکواریوم‌دار', description: '۱۰ ماهی در آکواریوم', emoji: '🏠', unlocked: false },
  { id: 'speed_demon', title: 'سریع‌ترین!', description: 'در کمتر از ۳ ثانیه جواب بده', emoji: '⚡', unlocked: false },
  { id: 'golden_fish', title: 'ماهی طلایی', description: 'یک ماهی طلایی بگیر', emoji: '✨', unlocked: false },
  { id: 'no_mistake', title: 'بی‌خطا', description: 'یک فصل بدون اشتباه', emoji: '💎', unlocked: false },
];

// قدرت‌های اولیه
export const DEFAULT_POWERUPS = [
  { type: 'extraTime' as const, count: 3, emoji: '⏰', label: 'زمان +۵' },
  { type: 'freezeTime' as const, count: 2, emoji: '❄️', label: 'یخ زمان' },
  { type: 'removeChoice' as const, count: 2, emoji: '🔍', label: 'حذف غلط' },
  { type: 'shield' as const, count: 1, emoji: '🛡️', label: 'محافظ' },
];