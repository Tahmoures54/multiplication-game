// ===== انواع داده‌های بازی ماهیگیری جدول ضرب =====

export interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  vy: number;
  wig: number;
  ph: number;
}

export interface BGFish {
  id: number;
  x: number;
  y: number;
  vx: number;
  size: number;
  body: string;
  outline: string;
  ph: number;
  // نوع ماهی: معمولی، نادر، طلایی
  kind?: 'normal' | 'rare' | 'golden';
}

export interface Particle {
  id: number;
  kind: 'confetti' | 'spark' | 'splash' | 'firework' | 'heart' | 'star' | 'snow' | 'leaf' | 'petal';
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number;
  life: number;
  maxLife: number;
  color: string;
  r: number;
  rotation?: number;
  rotSpeed?: number;
}

export interface CaughtFish {
  body: string;
  outline: string;
  size: number;
  value?: number;
  kind?: 'normal' | 'rare' | 'golden';
  timestamp?: number;
}

// === کوسه شگفت‌انگیز ===
export interface SharkState {
  visible: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  expression: 'wink' | 'tongue' | 'laugh' | 'happy' | 'cool';
  message: string;
  phase: 'entering' | 'performing' | 'leaving' | 'idle';
  timer: number;
  scale: number;
  wobble: number;
  bubbles: { x: number; y: number; r: number; life: number }[];
}

// === نوع سوال ===
export type QuestionType = 'normal' | 'missing' | 'multichoice' | 'truefalse' | 'chain';

export interface Question {
  type: QuestionType;
  a: number;
  b: number;
  correct: number;
  display: string;
  // برای چندگزینه‌ای
  choices?: number[];
  // برای صحیح/غلط
  proposed?: number;
  isProposedCorrect?: boolean;
  // برای زنجیره‌ای
  chainDisplay?: string;
}

// === فصل‌های بصری ===
export type VisualSeason = 'spring' | 'summer' | 'autumn' | 'winter';

// === دستاوردها ===
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

// === قدرت‌های ویژه ===
export interface PowerUp {
  type: 'extraTime' | 'freezeTime' | 'removeChoice' | 'shield';
  count: number;
  emoji: string;
  label: string;
}

// === ذخیره‌سازی ===
export interface SaveData {
  highScore: number;
  bestCombo: number;
  totalCorrect: number;
  totalPlayed: number;
  aquarium: CaughtFish[];
  achievements: Achievement[];
  sharkSeen: number;
  hasSharkPet: boolean;
  coins: number;
  starsPerEpisode: Record<string, number>; // "season-episode" -> stars
  lastPlayDate: string;
  powerUps: PowerUp[];
}

export type GameScreen = 'start' | 'playing' | 'gameover' | 'aquarium' | 'achievements' | 'boss';

export interface GameState {
  screen: GameScreen;
  season: number;
  episode: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  question: Question;
  timeLimit: number;
  timeLeft: number;
  timerRunning: boolean;
  paused: boolean;
  feedbackText: string;
  feedbackColor: string;
  gameWon: boolean;
  shaking: boolean;
  flashWhite: boolean;
  // جدید
  visualSeason: VisualSeason;
  shark: SharkState;
  stars: number; // ستاره‌های این قسمت
  isBoss: boolean; // آیا مرحله باس است
  bossHP: number; // جان باس
  bossMaxHP: number;
  coins: number;
  powerUps: PowerUp[];
  shieldActive: boolean;
  timeFrozen: boolean;
  timeFreezeLeft: number;
  questionType: QuestionType;
  selectedChoice: number | null;
  // صدا
  soundOn: boolean;
  musicOn: boolean;
}