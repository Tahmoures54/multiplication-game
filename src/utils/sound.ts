// ===== سیستم صدا با Web Audio API =====

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// پخش یک نت ساده
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // ignore audio errors
  }
}

// صدای پاسخ درست - ملودی شاد
export function playCorrectSound() {
  playTone(523, 0.12, 'sine', 0.12); // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 80); // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 160); // G5
  setTimeout(() => playTone(1047, 0.25, 'sine', 0.12), 240); // C6
}

// صدای پاسخ غلط
export function playWrongSound() {
  playTone(300, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.06), 120);
}

// صدای صید ماهی
export function playCatchSound() {
  playTone(880, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(1100, 0.08, 'sine', 0.1), 60);
  setTimeout(() => playTone(1320, 0.12, 'sine', 0.12), 120);
}

// صدای کلیک
export function playClickSound() {
  playTone(600, 0.05, 'sine', 0.06);
}

// صدای تایمر (هشدار)
export function playTimerWarning() {
  playTone(440, 0.1, 'square', 0.05);
}

// صدای کوسه - غرش ملایم کارتونی
export function playSharkSound() {
  playTone(120, 0.3, 'sawtooth', 0.08);
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.06), 200);
  setTimeout(() => {
    // صدای خنده
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(400 + i * 50, 0.08, 'sine', 0.08), i * 100);
    }
  }, 400);
}

// صدای باس
export function playBossSound() {
  playTone(80, 0.4, 'sawtooth', 0.1);
  setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.08), 300);
  setTimeout(() => playTone(60, 0.5, 'sawtooth', 0.12), 500);
}

// صدای پیروزی
export function playVictorySound() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.15, 'sine', 0.1), i * 100);
  });
}

// صدای قدرت ویژه
export function playPowerUpSound() {
  playTone(500, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(700, 0.1, 'sine', 0.1), 80);
  setTimeout(() => playTone(900, 0.15, 'sine', 0.12), 160);
}

// صدای دستاورد
export function playAchievementSound() {
  const melody = [659, 784, 880, 1047, 1175, 1319];
  melody.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.18, 'sine', 0.1), i * 120);
  });
}

// === موسیقی پس‌زمینه ملایم و آرام (برای کودکان) ===
let bgInterval: ReturnType<typeof setInterval> | null = null;
let bgNoteIndex = 0;

// ملودی نرم و آرام در گام C major (خیلی ملایم)
const BG_MELODY = [
  { freq: 262, dur: 0.4 }, // C4
  { freq: 330, dur: 0.4 }, // E4
  { freq: 392, dur: 0.4 }, // G4
  { freq: 523, dur: 0.5 }, // C5
  { freq: 392, dur: 0.4 }, // G4
  { freq: 330, dur: 0.4 }, // E4
  { freq: 294, dur: 0.4 }, // D4
  { freq: 262, dur: 0.6 }, // C4
  { freq: 349, dur: 0.4 }, // F4
  { freq: 392, dur: 0.4 }, // G4
  { freq: 440, dur: 0.5 }, // A4
  { freq: 392, dur: 0.4 }, // G4
  { freq: 330, dur: 0.4 }, // E4
  { freq: 294, dur: 0.4 }, // D4
  { freq: 262, dur: 0.7 }, // C4
];

export function startBGMusic() {
  stopBGMusic();
  bgNoteIndex = 0;

  const playNext = () => {
    const note = BG_MELODY[bgNoteIndex % BG_MELODY.length];
    // حجم خیلی کم برای موسیقی پس‌زمینه
    playTone(note.freq, note.dur, 'sine', 0.025);
    // گاهی نت اکتاو بالاتر خیلی نرم
    if (bgNoteIndex % 4 === 0) {
      setTimeout(() => playTone(note.freq * 2, note.dur * 0.6, 'sine', 0.012), 50);
    }
    bgNoteIndex++;
  };

  playNext();
  bgInterval = setInterval(playNext, 900); // ریتم آرام
}

export function stopBGMusic() {
  if (bgInterval) {
    clearInterval(bgInterval);
    bgInterval = null;
  }
}
