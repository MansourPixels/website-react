import { cn } from "@heroui/react";
import { useEffect, useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ConfettiProps {
  /** Altere este valor para disparar uma nova explosão de confete. */
  fireKey?: number;
  /** Permite sobrepor o empilhamento (z-index) quando há um modal aberto. */
  className?: string;
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

const COLORS = [
  "#FACC15",
  "#F472B6",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#FB923C",
];
const PIECE_COUNT = 140;
const GRAVITY = 320;
const DURATION_MS = 2800;

// Confete em canvas, sem dependências, que cobre a tela por alguns segundos e
// some sozinho. Respeita quem prefere menos movimento: nesse caso não renderiza.
export function Confetti({ fireKey = 0, className }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.4,
      vx: (Math.random() - 0.5) * 240,
      vy: 120 + Math.random() * 200,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 8,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let start: number | null = null;
    let last = 0;
    let raf = 0;

    function frame(now: number) {
      if (start === null) {
        start = now;
        last = now;
      }
      // Limita o passo para não "teleportar" os confetes após um frame longo.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const elapsed = now - start;
      const alpha = Math.max(0, 1 - elapsed / DURATION_MS);

      ctx!.clearRect(0, 0, width, height);
      for (const p of pieces) {
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }

      if (elapsed < DURATION_MS) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx!.clearRect(0, 0, width, height);
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fireKey, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-50 h-full w-full",
        className,
      )}
    />
  );
}
