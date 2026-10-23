import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

const COLORS = ["#f43f5e", "#facc15", "#22d3ee", "#a855f7", "#34d399", "#fb923c", "#60a5fa", "#ffffff"];

/** Pre-render a soft radial glow disc for one colour (cheap to blit each frame). */
function makeGlow(color: string): HTMLCanvasElement {
  const r = 16;
  const c = document.createElement("canvas");
  c.width = c.height = r * 2;
  const g = c.getContext("2d");
  if (g) {
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, color);
    grd.addColorStop(0.35, color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, r * 2, r * 2);
  }
  return c;
}

/**
 * A full-screen celebratory fireworks canvas, mounted only while a game is won.
 * Particles are drawn by blitting a pre-rendered glow sprite (no per-frame
 * shadowBlur), so it stays smooth even with a few hundred sparks on screen.
 */
export function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const glows = new Map(COLORS.map((c) => [c, makeGlow(c)]));
    let parts: Particle[] = [];
    let raf = 0;
    let t = 0;

    const rand = () => Math.random();
    const burst = (x: number, y: number) => {
      const base = COLORS[Math.floor(rand() * COLORS.length)];
      const n = 30 + Math.floor(rand() * 24);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + rand() * 0.3;
        const sp = 1.8 + rand() * 4;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 50 + rand() * 40,
          color: rand() < 0.25 ? "#ffffff" : base,
          size: 6 + rand() * 6,
        });
      }
    };

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const loop = () => {
      t++;
      ctx.clearRect(0, 0, W(), H());
      if (t % 18 === 0) burst(rand() * W(), 40 + rand() * H() * 0.55);

      ctx.globalCompositeOperation = "lighter";
      const next: Particle[] = [];
      for (const p of parts) {
        p.life++;
        if (p.life >= p.max) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.985;
        p.vy *= 0.985;
        next.push(p);
        const alpha = 1 - p.life / p.max;
        ctx.globalAlpha = alpha * alpha;
        const sprite = glows.get(p.color) ?? glows.get("#ffffff")!;
        ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      parts = next;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = window.requestAnimationFrame(loop);
    };

    burst(W() * 0.5, H() * 0.38);
    burst(W() * 0.28, H() * 0.3);
    burst(W() * 0.72, H() * 0.34);
    loop();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[55]" />;
}
