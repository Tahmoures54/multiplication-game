import { useRef, useEffect } from 'react';
import type { Bubble, BGFish, Particle, CaughtFish, SharkState, VisualSeason } from '../types';

interface Props {
  width: number;
  height: number;
  bubbles: Bubble[];
  bgFish: BGFish[];
  particles: Particle[];
  caught: CaughtFish[];
  wavePhase: number;
  flashWhite: boolean;
  shark: SharkState;
  visualSeason: VisualSeason;
  birds: { x: number; y: number; vx: number; wingPhase: number }[];
  clouds: { x: number; y: number; w: number; speed: number }[];
  isBoss: boolean;
  bossHP: number;
  bossMaxHP: number;
}

// رسم ماهی کارتونی
function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  body: string,
  outline: string,
  isGolden = false
) {
  ctx.save();

  // درخشش ماهی طلایی
  if (isGolden) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
  }

  // بدنه
  ctx.beginPath();
  ctx.ellipse(x, y, size / 2, size / 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // دم
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2 + size / 3, y - size / 4);
  ctx.lineTo(x + size / 2 + size / 3, y + size / 4);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.stroke();

  // باله بالا
  ctx.beginPath();
  ctx.moveTo(x - size / 8, y - size / 4);
  ctx.lineTo(x + size / 10, y - size / 2);
  ctx.lineTo(x + size / 6, y - size / 4);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // چشم
  const ex = x - size / 4;
  const ey = y - size / 12;
  ctx.beginPath();
  ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex - 1.5, ey - 1.5, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.restore();
}

// رسم کوسه‌خالخالی
function drawShark(
  ctx: CanvasRenderingContext2D,
  shark: SharkState,
  canvasW: number,
) {
  if (!shark.visible) return;

  ctx.save();
  ctx.translate(shark.x, shark.y);
  ctx.scale(shark.scale, shark.scale);

  const wobble = Math.sin(shark.wobble) * 3;

  // === حباب‌های کوسه ===
  shark.bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x - shark.x, b.y - shark.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 240, 255, ${b.life / 35})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // === بدن کوسه (بزرگ و بامزه) ===
  ctx.translate(0, wobble);

  // بدنه اصلی
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 35, 0, 0, Math.PI * 2);
  // گرادیان
  const bodyGrad = ctx.createLinearGradient(0, -35, 0, 35);
  bodyGrad.addColorStop(0, '#64748b');
  bodyGrad.addColorStop(0.5, '#94a3b8');
  bodyGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // خال‌خالی‌ها (ویژگی منحصر به فرد!)
  const dots = [
    { x: -30, y: -8 }, { x: -15, y: 5 }, { x: 5, y: -12 },
    { x: 20, y: 3 }, { x: -5, y: 10 }, { x: 35, y: -5 },
    { x: -40, y: 2 }, { x: 15, y: -18 },
  ];
  dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#93c5fd';
    ctx.fill();
  });

  // باله بالایی
  ctx.beginPath();
  ctx.moveTo(-5, -35);
  ctx.lineTo(5, -60);
  ctx.lineTo(20, -35);
  ctx.closePath();
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // دم
  ctx.beginPath();
  ctx.moveTo(70, 0);
  ctx.lineTo(100, -25);
  ctx.lineTo(95, 0);
  ctx.lineTo(100, 25);
  ctx.closePath();
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();

  // باله‌های کناری
  ctx.beginPath();
  ctx.moveTo(-20, 25);
  ctx.lineTo(-35, 45);
  ctx.lineTo(-5, 30);
  ctx.closePath();
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, 25);
  ctx.lineTo(10, 45);
  ctx.lineTo(35, 30);
  ctx.closePath();
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.stroke();

  // شکم سفید
  ctx.beginPath();
  ctx.ellipse(0, 12, 50, 18, 0, 0, Math.PI);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();

  // === صورت (بسته به شکلک) ===
  const drawEyes = () => {
    switch (shark.expression) {
      case 'wink':
        // چشم چپ باز
        ctx.beginPath();
        ctx.arc(-25, -10, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-25, -10, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-27, -12, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        // چشم راست (چشمک)
        ctx.beginPath();
        ctx.moveTo(-45, -10);
        ctx.quadraticCurveTo(-35, -5, -25, -10);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'tongue':
        // هر دو چشم باز
        [-25, 10].forEach(ex => {
          ctx.beginPath();
          ctx.arc(ex, -10, 10, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex, -10, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex - 2, -12, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        });
        break;

      case 'laugh':
        // چشم‌های خندان (بسته)
        [-25, 10].forEach(ex => {
          ctx.beginPath();
          ctx.arc(ex, -10, 8, Math.PI * 0.1, Math.PI * 0.9);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.stroke();
        });
        break;

      case 'cool':
        // عینک آفتابی
        [-25, 10].forEach(ex => {
          ctx.beginPath();
          ctx.roundRect(ex - 12, -18, 24, 16, 4);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
          // انعکاس
          ctx.beginPath();
          ctx.arc(ex + 3, -12, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fill();
        });
        // پل عینک
        ctx.beginPath();
        ctx.moveTo(-13, -10);
        ctx.lineTo(-2, -10);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      default: // happy
        [-25, 10].forEach(ex => {
          ctx.beginPath();
          ctx.arc(ex, -10, 10, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex, -8, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex - 2, -10, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        });
        break;
    }
  };

  const drawMouth = () => {
    ctx.lineWidth = 2.5;
    switch (shark.expression) {
      case 'tongue':
        // دهان باز با زبان
        ctx.beginPath();
        ctx.arc(-8, 8, 15, 0, Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        // زبان
        ctx.beginPath();
        ctx.ellipse(-8, 18, 8, 6, 0, 0, Math.PI);
        ctx.fillStyle = '#fb7185';
        ctx.fill();
        // دندان‌های بامزه
        ctx.fillStyle = 'white';
        [-18, -10, -2, 6].forEach(tx => {
          ctx.beginPath();
          ctx.moveTo(tx, 8);
          ctx.lineTo(tx + 3, 14);
          ctx.lineTo(tx + 6, 8);
          ctx.fill();
        });
        break;

      case 'laugh':
        // دهان بزرگ خندان
        ctx.beginPath();
        ctx.arc(-8, 5, 20, 0.1, Math.PI - 0.1);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        // دندان‌ها
        ctx.fillStyle = 'white';
        [-22, -14, -6, 2, 10].forEach(tx => {
          ctx.beginPath();
          ctx.moveTo(tx, 5);
          ctx.lineTo(tx + 2, 12);
          ctx.lineTo(tx + 5, 5);
          ctx.fill();
        });
        break;

      default:
        // لبخند ساده
        ctx.beginPath();
        ctx.arc(-8, 5, 18, 0.2, Math.PI - 0.2);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
    }
  };

  drawEyes();
  drawMouth();

  // گونه‌های صورتی
  ctx.beginPath();
  ctx.arc(-40, 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.4)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(25, 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.4)';
  ctx.fill();

  ctx.restore();

  // === پیام کوسه ===
  if (shark.phase === 'performing' && shark.message) {
    ctx.save();
    const msgX = Math.min(canvasW - 100, Math.max(80, shark.x));
    const msgY = shark.y - 70 * shark.scale;

    // بالن پیام
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    const textWidth = ctx.measureText(shark.message).width;
    const padX = 12;
    const padY = 8;
    const bw = Math.min(textWidth + padX * 2, canvasW * 0.6);
    const bh = 28;
    const bx = msgX - bw / 2;
    const by = msgY - bh / 2;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 10);
    ctx.fill();
    ctx.stroke();

    // فلش بالن
    ctx.beginPath();
    ctx.moveTo(msgX - 8, msgY + bh / 2);
    ctx.lineTo(msgX, msgY + bh / 2 + 10);
    ctx.lineTo(msgX + 8, msgY + bh / 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Tahoma';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shark.message, msgX, msgY, bw - padX);
    ctx.restore();
  }
}

// رسم پرنده
function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, wingPhase: number) {
  const wing = Math.sin(wingPhase) * 6;
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 4, y - wing, x, y);
  ctx.quadraticCurveTo(x + 4, y - wing, x + 8, y);
  ctx.stroke();
}

// رسم ابر
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const r = w * 0.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r, y - r * 0.4, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x + r * 1.5, y, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x - r * 0.8, y + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

// رسم هیولای باس
function drawBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHP: number,
  wobble: number,
) {
  ctx.save();
  ctx.translate(x, y + Math.sin(wobble) * 5);

  const hpRatio = hp / maxHP;

  // بدنه هیولا
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 35, 0, 0, Math.PI * 2);
  const bossGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
  bossGrad.addColorStop(0, '#dc2626');
  bossGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = bossGrad;
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // شاخ‌ها
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(-20, -30);
  ctx.lineTo(-15, -55);
  ctx.lineTo(-8, -30);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -30);
  ctx.lineTo(15, -55);
  ctx.lineTo(20, -30);
  ctx.fill();

  // چشم‌ها
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(-18, -8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(18, -8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(-18, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(18, -8, 5, 0, Math.PI * 2);
  ctx.fill();

  // دهان
  ctx.beginPath();
  ctx.arc(0, 12, 18, 0.1, Math.PI - 0.1);
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  // دندان‌ها
  ctx.fillStyle = 'white';
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 12);
    ctx.lineTo(i + 2, 20);
    ctx.lineTo(i + 4, 12);
    ctx.fill();
  }

  // نوار HP
  const barW = 80;
  const barH = 8;
  const barX = -barW / 2;
  const barY = -70;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(barX, barY, barW * hpRatio, barH);
  ctx.strokeStyle = '#0b1220';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 7px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText(`${hp}/${maxHP}`, 0, barY - 3);

  ctx.restore();
}

export const GameCanvas = ({
  width, height, bubbles, bgFish, particles, caught, wavePhase,
  flashWhite, shark, visualSeason, birds, clouds, isBoss, bossHP, bossMaxHP,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const waterLine = height * 0.37;

    // === رنگ‌های فصلی ===
    let skyTop = '#7dd3fc';
    let skyBottom = '#e0f2fe';
    let waterTop = '#38bdf8';
    let waterMid = '#0ea5e9';
    let waterBottom = '#0369a1';
    let sandColor = '#fde68a';

    switch (visualSeason) {
      case 'spring':
        skyTop = '#a5f3fc';
        skyBottom = '#fce7f3';
        waterTop = '#67e8f9';
        break;
      case 'summer':
        skyTop = '#38bdf8';
        skyBottom = '#fef3c7';
        waterTop = '#22d3ee';
        sandColor = '#fde68a';
        break;
      case 'autumn':
        skyTop = '#fb923c';
        skyBottom = '#fef3c7';
        waterTop = '#0ea5e9';
        waterMid = '#0284c7';
        break;
      case 'winter':
        skyTop = '#94a3b8';
        skyBottom = '#e2e8f0';
        waterTop = '#64748b';
        waterMid = '#475569';
        waterBottom = '#1e293b';
        sandColor = '#e2e8f0';
        break;
    }

    // آسمان
    const skyGrad = ctx.createLinearGradient(0, 0, 0, waterLine);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, waterLine);

    // آب
    const waterGrad = ctx.createLinearGradient(0, waterLine, 0, height);
    waterGrad.addColorStop(0, waterTop);
    waterGrad.addColorStop(0.5, waterMid);
    waterGrad.addColorStop(1, waterBottom);
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterLine, width, height - waterLine);

    // === ابرها ===
    clouds.forEach(c => drawCloud(ctx, c.x, c.y, c.w));

    // === خورشید ===
    const sunX = width - width * 0.12;
    const sunY = height * 0.08;
    const sunR = Math.min(width, height) * 0.07;

    if (visualSeason !== 'winter') {
      // پرتوها
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      for (let a = 0; a < 360; a += 30) {
        const rad = ((a + wavePhase * 2) * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(sunX + sunR * 1.2 * Math.cos(rad), sunY + sunR * 1.2 * Math.sin(rad));
        ctx.lineTo(sunX + sunR * 1.7 * Math.cos(rad), sunY + sunR * 1.7 * Math.sin(rad));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fillStyle = visualSeason === 'autumn' ? '#f97316' : '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // صورت خورشید
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(sunX - 3, sunY - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX + 3, sunY - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX, sunY + 1, 4, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // ماه در زمستان
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sunX + 4, sunY - 2, sunR * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // === پرندگان ===
    if (visualSeason !== 'winter') {
      birds.forEach(bird => drawBird(ctx, bird.x, bird.y, bird.wingPhase));
    }

    // === امواج ===
    ctx.fillStyle = waterTop;
    for (let x = -30; x < width + 30; x += 25) {
      const off = (x + wavePhase * 15) % 25;
      ctx.beginPath();
      ctx.arc(x + off, waterLine, 16, Math.PI, 0);
      ctx.fill();
    }

    // === شن ===
    ctx.fillStyle = sandColor;
    ctx.fillRect(0, height - 14, width, 14);
    // سنگریزه‌ها
    ctx.fillStyle = visualSeason === 'winter' ? '#cbd5e1' : '#d4a574';
    for (let i = 0; i < 8; i++) {
      const rx = (i * 53 + 20) % width;
      ctx.beginPath();
      ctx.arc(rx, height - 7, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    // گیاهان دریایی
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const gx = (i * 87 + 30) % width;
      const gh = 10 + (i % 3) * 5;
      const sway = Math.sin(wavePhase + i) * 3;
      ctx.beginPath();
      ctx.moveTo(gx, height - 14);
      ctx.quadraticCurveTo(gx + sway, height - 14 - gh / 2, gx + sway * 1.5, height - 14 - gh);
      ctx.stroke();
    }

    // === ماهی‌های پس‌زمینه ===
    bgFish.forEach(f => {
      drawFish(ctx, f.x, f.y, f.size, f.body, f.outline, f.kind === 'golden');
    });

    // === حباب‌ها ===
    bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(230, 255, 251, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    });

    // === شخصیت ماهیگیر ===
    const dockY = waterLine - 5;
    const dockX = width * 0.03;
    const dockW = width * 0.14;

    // اسکله
    ctx.fillStyle = '#8b5a2b';
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;
    ctx.fillRect(dockX, dockY, dockW, 16);
    ctx.strokeRect(dockX, dockY, dockW, 16);
    // پایه‌های اسکله
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(dockX + 5, dockY + 16, 6, 20);
    ctx.fillRect(dockX + dockW - 11, dockY + 16, 6, 20);

    const personX = dockX + dockW / 2;
    const personY = dockY;

    // پاها
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(personX - 10, personY - 30, 8, 30);
    ctx.fillRect(personX + 2, personY - 30, 8, 30);

    // کفش
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(personX - 12, personY - 2, 10, 4);
    ctx.fillRect(personX + 2, personY - 2, 10, 4);

    // تنه
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(personX - 16, personY - 65, 32, 38);
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(personX - 16, personY - 65, 32, 38);

    // دکمه‌ها
    ctx.fillStyle = '#fbbf24';
    [personY - 55, personY - 45, personY - 35].forEach(by => {
      ctx.beginPath();
      ctx.arc(personX, by, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // سر
    ctx.beginPath();
    ctx.arc(personX, personY - 78, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa';
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // کلاه ماهیگیری
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(personX, personY - 88, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(personX - 10, personY - 95, 20, 10);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // چشم‌ها
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(personX - 5, personY - 80, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(personX + 5, personY - 80, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.beginPath(); ctx.arc(personX - 5, personY - 79, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(personX + 5, personY - 79, 2, 0, Math.PI * 2); ctx.fill();
    // برق چشم
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(personX - 6, personY - 81, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(personX + 4, personY - 81, 1, 0, Math.PI * 2); ctx.fill();

    // لبخند
    ctx.beginPath();
    ctx.arc(personX, personY - 73, 7, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // بازو + چوب ماهیگیری
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(personX + 16, personY - 50);
    ctx.lineTo(personX + 30, personY - 62);
    ctx.stroke();

    const rodX = personX + 30;
    const rodTopY = personY - 90;
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodX, rodTopY);
    ctx.lineTo(rodX, personY - 45);
    ctx.stroke();

    // نخ ماهیگیری
    const hookSwing = Math.sin(wavePhase) * (width * 0.025);
    const hookX = width * 0.38 + hookSwing;
    const hookY = height * 0.55 + Math.sin(wavePhase) * 5;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(rodX, rodTopY);
    // خم نخ
    ctx.quadraticCurveTo(
      (rodX + hookX) / 2, rodTopY + 30,
      hookX, hookY
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // قلاب
    ctx.beginPath();
    ctx.arc(hookX, hookY + 8, 6, 0, Math.PI);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hookX + 6, hookY + 8);
    ctx.lineTo(hookX + 4, hookY + 14);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // شناور
    ctx.beginPath();
    ctx.arc(hookX, hookY - 3, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hookX, hookY - 3, 4, 0, Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // === آکواریوم ===
    const aqX = width - width * 0.28;
    const aqY = waterLine - 8;
    const aqW = width * 0.26;
    const aqH = height * 0.2;

    // شیشه آکواریوم
    ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(aqX, aqY, aqW, aqH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0b1220';
    ctx.font = 'bold 9px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText(`🐟 آکواریوم (${caught.length})`, aqX + aqW / 2, aqY + 12);

    const recent = caught.slice(-6);
    let fishDrawX = aqX + aqW - 18;
    const fishDrawY = aqY + aqH / 2 + 6;
    recent.reverse().forEach(f => {
      drawFish(ctx, fishDrawX, fishDrawY, f.size * 0.6, f.body, f.outline, f.kind === 'golden');
      fishDrawX -= 20;
    });

    // === هیولای باس ===
    if (isBoss) {
      drawBoss(ctx, width * 0.55, height * 0.6, bossHP, bossMaxHP, wavePhase * 2);
    }

    // === کوسه ===
    drawShark(ctx, shark, width);

    // === ذرات ===
    particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      switch (p.kind) {
        case 'confetti':
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-3, -3, 6, 6);
          ctx.restore();
          break;

        case 'spark':
          ctx.font = '12px serif';
          ctx.fillText('✨', p.x, p.y);
          break;

        case 'star':
          ctx.font = '14px serif';
          ctx.fillText('⭐', p.x - 7, p.y + 5);
          break;

        case 'heart':
          ctx.font = '14px serif';
          ctx.fillText('❤️', p.x - 7, p.y + 5);
          break;

        case 'firework':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          // دنباله
          ctx.beginPath();
          ctx.arc(p.x - p.vx, p.y - p.vy, p.r * 0.6, 0, Math.PI * 2);
          ctx.globalAlpha = alpha * 0.5;
          ctx.fill();
          break;

        case 'splash':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;

        case 'petal':
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
          break;

        case 'leaf':
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          // رگ برگ
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(-p.r, 0);
          ctx.lineTo(p.r, 0);
          ctx.stroke();
          ctx.restore();
          break;

        case 'snow':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          break;
      }

      ctx.globalAlpha = 1;
    });

    // === فلش سفید ===
    if (flashWhite) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, 0, width, height);
    }

  }, [width, height, bubbles, bgFish, particles, caught, wavePhase, flashWhite,
    dpr, shark, visualSeason, birds, clouds, isBoss, bossHP, bossMaxHP]);

  return (
    <canvas
      ref={canvasRef}
      width={width * dpr}
      height={height * dpr}
      style={{
        width: '100%',
        height: 'auto',
        aspectRatio: `${width}/${height}`,
        borderRadius: '14px',
        border: '2px solid #1e3a5f',
        boxShadow: '0 4px 20px rgba(0, 100, 200, 0.3)',
      }}
    />
  );
};