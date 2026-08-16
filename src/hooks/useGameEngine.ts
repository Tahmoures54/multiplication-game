import { useRef, useCallback, useEffect, useState } from 'react';
import type { Bubble, BGFish, Particle, CaughtFish, SharkState, VisualSeason } from '../types';
import { FISH_PALETTE, RARE_FISH_PALETTE, SHARK_MESSAGES, SHARK_EXPRESSIONS } from '../constants';

let nextId = 0;
const uid = () => ++nextId;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useGameEngine(canvasW: number, canvasH: number) {
  const bubblesRef = useRef<Bubble[]>([]);
  const bgFishRef = useRef<BGFish[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const caughtRef = useRef<CaughtFish[]>([]);
  const wavePhaseRef = useRef(0);
  const animRef = useRef<number>(0);
  const visualSeasonRef = useRef<VisualSeason>('spring');
  const sharkRef = useRef<SharkState>({
    visible: false,
    x: -200,
    y: canvasH * 0.5,
    targetX: canvasW * 0.5,
    targetY: canvasH * 0.45,
    expression: 'happy',
    message: '',
    phase: 'idle',
    timer: 0,
    scale: 1,
    wobble: 0,
    bubbles: [],
  });
  // پرندگان
  const birdsRef = useRef<{ x: number; y: number; vx: number; wingPhase: number }[]>([]);
  // ابرها
  const cloudsRef = useRef<{ x: number; y: number; w: number; speed: number }[]>([]);

  const [, forceRender] = useState(0);

  // ایجاد ابرها
  const spawnClouds = useCallback(() => {
    cloudsRef.current = [];
    for (let i = 0; i < 4; i++) {
      cloudsRef.current.push({
        x: Math.random() * canvasW,
        y: 10 + Math.random() * (canvasH * 0.2),
        w: 40 + Math.random() * 60,
        speed: 0.15 + Math.random() * 0.3,
      });
    }
  }, [canvasW, canvasH]);

  // ایجاد پرندگان
  const spawnBirds = useCallback(() => {
    birdsRef.current = [];
    for (let i = 0; i < 3; i++) {
      birdsRef.current.push({
        x: Math.random() * canvasW,
        y: 15 + Math.random() * (canvasH * 0.15),
        vx: 0.5 + Math.random() * 1,
        wingPhase: Math.random() * Math.PI * 2,
      });
    }
  }, [canvasW, canvasH]);

  const spawnBackgroundFish = useCallback(() => {
    bgFishRef.current = [];
    for (let i = 0; i < 10; i++) {
      const isRare = Math.random() < 0.1;
      const isGolden = !isRare && Math.random() < 0.05;
      const palette = isRare ? RARE_FISH_PALETTE : FISH_PALETTE;
      const [body, outline] = palette[Math.floor(Math.random() * palette.length)];
      bgFishRef.current.push({
        id: uid(),
        x: Math.random() * canvasW,
        y: 0.5 * canvasH + Math.random() * (canvasH * 0.38),
        vx: 0.4 + Math.random() * 1.4,
        size: isRare ? 35 + Math.random() * 15 : (isGolden ? 28 + Math.random() * 12 : 18 + Math.random() * 28),
        body: isGolden ? '#ffd700' : body,
        outline: isGolden ? '#b8860b' : outline,
        ph: Math.random() * Math.PI * 2,
        kind: isRare ? 'rare' : (isGolden ? 'golden' : 'normal'),
      });
    }
    spawnClouds();
    spawnBirds();
  }, [canvasW, canvasH, spawnClouds, spawnBirds]);

  // === انیمیشن کوسه ===
  const triggerShark = useCallback(() => {
    const shark = sharkRef.current;
    if (shark.visible) return;
    shark.visible = true;
    shark.phase = 'entering';
    shark.x = -150;
    shark.y = canvasH * 0.55;
    shark.targetX = canvasW * 0.45;
    shark.targetY = canvasH * 0.45;
    shark.expression = pick(SHARK_EXPRESSIONS);
    shark.message = pick(SHARK_MESSAGES);
    shark.timer = 180; // ~6 ثانیه
    shark.scale = 0.3;
    shark.wobble = 0;
    shark.bubbles = [];
  }, [canvasW, canvasH]);

  const confettiBurst = useCallback(() => {
    const cx = canvasW / 2;
    const cy = canvasH * 0.3;
    for (let i = 0; i < 45; i++) {
      const colors = ["#fb7185", "#f59e0b", "#22c55e", "#60a5fa", "#a78bfa", "#facc15", "#ec4899", "#14b8a6"];
      particlesRef.current.push({
        id: uid(),
        kind: 'confetti',
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 10,
        vy: -3 - Math.random() * 6,
        ay: 0.25,
        life: 30 + Math.floor(Math.random() * 35),
        maxLife: 65,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
    // ستاره‌ها
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        id: uid(),
        kind: 'star',
        x: cx + (Math.random() - 0.5) * 160,
        y: cy + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 3,
        ay: 0.02,
        life: 20 + Math.floor(Math.random() * 20),
        maxLife: 40,
        color: '#ffd700',
        r: 8,
      });
    }
    // قلب‌ها
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        id: uid(),
        kind: 'heart',
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        ay: 0.01,
        life: 25 + Math.floor(Math.random() * 20),
        maxLife: 45,
        color: '#ef4444',
        r: 10,
      });
    }
  }, [canvasW, canvasH]);

  // آتش‌بازی
  const fireworkBurst = useCallback(() => {
    const cx = canvasW * (0.3 + Math.random() * 0.4);
    const cy = canvasH * (0.15 + Math.random() * 0.2);
    const color = pick(["#fb7185", "#f59e0b", "#22c55e", "#60a5fa", "#a78bfa", "#facc15"]);
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        id: uid(),
        kind: 'firework',
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ay: 0.05,
        life: 20 + Math.floor(Math.random() * 15),
        maxLife: 35,
        color,
        r: 3,
      });
    }
  }, [canvasW, canvasH]);

  const splashEffect = useCallback(() => {
    const sx = canvasW * 0.38;
    const sy = canvasH * 0.6;
    for (let i = 0; i < 16; i++) {
      particlesRef.current.push({
        id: uid(),
        kind: 'splash',
        x: sx + (Math.random() - 0.5) * 120,
        y: sy + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 3,
        vy: -0.5 - Math.random() * 2,
        ay: 0.06,
        life: 20 + Math.floor(Math.random() * 16),
        maxLife: 36,
        color: '#bae6fd',
        r: 5 + Math.floor(Math.random() * 12),
      });
    }
  }, [canvasW, canvasH]);

  // ذرات فصلی
  const spawnSeasonalParticle = useCallback((season: VisualSeason) => {
    if (Math.random() > 0.03) return; // فقط گاهی
    switch (season) {
      case 'spring':
        particlesRef.current.push({
          id: uid(),
          kind: 'petal',
          x: Math.random() * canvasW,
          y: -10,
          vx: 0.3 + Math.random() * 0.8,
          vy: 0.5 + Math.random() * 1,
          ay: 0,
          life: 80 + Math.floor(Math.random() * 40),
          maxLife: 120,
          color: pick(['#fce7f3', '#fbcfe8', '#f9a8d4']),
          r: 4 + Math.random() * 4,
          rotation: Math.random() * 360,
          rotSpeed: 1 + Math.random() * 3,
        });
        break;
      case 'autumn':
        particlesRef.current.push({
          id: uid(),
          kind: 'leaf',
          x: Math.random() * canvasW,
          y: -10,
          vx: 0.2 + Math.random() * 0.6,
          vy: 0.4 + Math.random() * 0.8,
          ay: 0,
          life: 80 + Math.floor(Math.random() * 40),
          maxLife: 120,
          color: pick(['#f97316', '#ea580c', '#dc2626', '#fbbf24']),
          r: 5 + Math.random() * 5,
          rotation: Math.random() * 360,
          rotSpeed: 1 + Math.random() * 2,
        });
        break;
      case 'winter':
        particlesRef.current.push({
          id: uid(),
          kind: 'snow',
          x: Math.random() * canvasW,
          y: -10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.3 + Math.random() * 0.6,
          ay: 0,
          life: 100 + Math.floor(Math.random() * 60),
          maxLife: 160,
          color: '#ffffff',
          r: 2 + Math.random() * 4,
        });
        break;
    }
  }, [canvasW, canvasH]);

  const catchFish = useCallback((value: number, kind: 'normal' | 'rare' | 'golden' = 'normal') => {
    const palette = kind === 'rare' ? RARE_FISH_PALETTE : FISH_PALETTE;
    const [body, outline] = kind === 'golden'
      ? ['#ffd700', '#b8860b']
      : palette[Math.floor(Math.random() * palette.length)];
    const size = Math.max(18, Math.min(35, 16 + Math.floor(value / 6)));
    caughtRef.current.push({ body, outline, size, value, kind, timestamp: Date.now() });
    if (caughtRef.current.length > 50) caughtRef.current = caughtRef.current.slice(-50);
  }, []);

  const setVisualSeason = useCallback((s: VisualSeason) => {
    visualSeasonRef.current = s;
  }, []);

  const tick = useCallback(() => {
    wavePhaseRef.current += 0.1;
    const wp = wavePhaseRef.current;
    const vs = visualSeasonRef.current;

    // ذرات فصلی
    spawnSeasonalParticle(vs);

    // spawn bubbles
    if (Math.random() < 0.07) {
      bubblesRef.current.push({
        id: uid(),
        x: 80 + Math.random() * (canvasW - 120),
        y: canvasH - 15,
        r: 3 + Math.random() * 8,
        vy: 0.7 + Math.random() * 1.8,
        wig: 0.3 + Math.random() * 1.5,
        ph: Math.random() * Math.PI * 2,
      });
    }

    // update bubbles
    bubblesRef.current = bubblesRef.current.filter(b => {
      b.y -= b.vy;
      b.x += Math.sin(wp + b.ph) * b.wig;
      return b.y > canvasH * 0.32;
    });

    // update bg fish
    bgFishRef.current.forEach(f => {
      f.x += f.vx;
      f.y += Math.sin(wp + f.ph) * 0.5;
      if (f.x > canvasW + 120) {
        f.x = -100;
        f.y = canvasH * 0.5 + Math.random() * (canvasH * 0.35);
      }
    });

    // update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.ay;
      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed;
      }
      // wiggle for seasonal particles
      if (p.kind === 'petal' || p.kind === 'leaf' || p.kind === 'snow') {
        p.x += Math.sin(wp + p.x * 0.01) * 0.3;
      }
      p.life--;
      return p.life > 0;
    });

    // update clouds
    cloudsRef.current.forEach(c => {
      c.x += c.speed;
      if (c.x > canvasW + 80) c.x = -80;
    });

    // update birds
    birdsRef.current.forEach(bird => {
      bird.x += bird.vx;
      bird.wingPhase += 0.15;
      if (bird.x > canvasW + 30) {
        bird.x = -30;
        bird.y = 15 + Math.random() * (canvasH * 0.15);
      }
    });

    // === آپدیت کوسه ===
    const shark = sharkRef.current;
    if (shark.visible) {
      shark.wobble += 0.08;
      shark.timer--;

      // حباب‌های کوسه
      if (Math.random() < 0.15) {
        shark.bubbles.push({
          x: shark.x + (Math.random() - 0.5) * 40,
          y: shark.y + 20,
          r: 2 + Math.random() * 4,
          life: 20 + Math.random() * 15,
        });
      }
      shark.bubbles = shark.bubbles.filter(b => {
        b.y -= 0.8;
        b.life--;
        return b.life > 0;
      });

      switch (shark.phase) {
        case 'entering':
          shark.x += (shark.targetX - shark.x) * 0.06;
          shark.y += (shark.targetY - shark.y) * 0.06;
          shark.scale += (1 - shark.scale) * 0.05;
          if (Math.abs(shark.x - shark.targetX) < 5) {
            shark.phase = 'performing';
          }
          break;
        case 'performing':
          shark.y += Math.sin(shark.wobble) * 1.5;
          shark.x += Math.sin(shark.wobble * 0.7) * 0.8;
          // تغییر شکلک هر چند فریم
          if (shark.timer % 40 === 0) {
            shark.expression = pick(SHARK_EXPRESSIONS);
          }
          if (shark.timer <= 30) {
            shark.phase = 'leaving';
          }
          break;
        case 'leaving':
          shark.x += (canvasW + 200 - shark.x) * 0.04;
          shark.scale *= 0.98;
          if (shark.x > canvasW + 100) {
            shark.visible = false;
            shark.phase = 'idle';
          }
          break;
      }

      if (shark.timer <= 0 && shark.phase !== 'leaving') {
        shark.phase = 'leaving';
      }
    }

    forceRender(v => v + 1);
  }, [canvasW, canvasH, spawnSeasonalParticle]);

  useEffect(() => {
    let running = true;
    let lastTime = 0;
    const throttledLoop = (time: number) => {
      if (!running) return;
      if (time - lastTime > 33) {
        tick();
        lastTime = time;
      }
      animRef.current = requestAnimationFrame(throttledLoop);
    };
    animRef.current = requestAnimationFrame(throttledLoop);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [tick]);

  return {
    bubblesRef,
    bgFishRef,
    particlesRef,
    caughtRef,
    wavePhaseRef,
    visualSeasonRef,
    sharkRef,
    birdsRef,
    cloudsRef,
    spawnBackgroundFish,
    confettiBurst,
    fireworkBurst,
    splashEffect,
    catchFish,
    triggerShark,
    setVisualSeason,
  };
}