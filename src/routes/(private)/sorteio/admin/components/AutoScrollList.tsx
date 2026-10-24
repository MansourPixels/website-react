import { cn } from "@heroui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";

interface AutoScrollListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Velocidade da rolagem. Lenta o bastante para ler um nome passando. */
  pixelsPerSecond?: number;
  className?: string;
}

// Passo máximo por quadro: ao voltar de uma aba oculta, o primeiro quadro
// chega com segundos de atraso e faria a lista saltar.
const MAX_STEP_SECONDS = 0.1;

/**
 * Lista que rola sozinha, em laço, quando não cabe na altura disponível — para
 * uma TV em que ninguém vai rolar nada. A lista é desenhada duas vezes, uma
 * logo abaixo da outra, e a posição volta ao início quando a primeira cópia
 * sai inteira de cena, o que deixa a emenda invisível.
 *
 * A posição fica numa ref e o movimento é feito quadro a quadro, e não por uma
 * animação CSS: assim, quando a lista é atualizada (e cresce), a rolagem
 * continua de onde estava em vez de recomeçar ou dar um tranco. Com o mouse em
 * cima, ela pausa, para quem está operando conseguir ler.
 */
export function AutoScrollList<T>({
  items,
  getKey,
  renderItem,
  pixelsPerSecond = 36,
  className,
}: AutoScrollListProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstCopyRef = useRef<HTMLUListElement | null>(null);
  const secondCopyRef = useRef<HTMLUListElement | null>(null);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const [overflows, setOverflows] = useState(false);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstCopy = firstCopyRef.current;
    if (!viewport || !firstCopy) return;

    const observer = new ResizeObserver(() => {
      setOverflows(firstCopy.offsetHeight > viewport.clientHeight);
    });
    observer.observe(viewport);
    observer.observe(firstCopy);

    return () => observer.disconnect();
  }, []);

  const isScrolling = overflows && !prefersReducedMotion;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (!isScrolling) {
      offsetRef.current = 0;
      track.style.transform = "";
      return;
    }

    let frameId = 0;
    let last: number | null = null;

    function frame(now: number) {
      const secondCopy = secondCopyRef.current;

      if (last !== null && secondCopy && !isPausedRef.current) {
        const step = Math.min((now - last) / 1000, MAX_STEP_SECONDS);
        // Um ciclo vai do topo da primeira cópia ao topo da segunda: inclui o
        // espaço entre elas, então a volta ao zero cai exatamente na emenda.
        const cycle = secondCopy.offsetTop;

        offsetRef.current = (offsetRef.current + pixelsPerSecond * step) % cycle;
        track!.style.transform = `translateY(${-offsetRef.current}px)`;
      }

      last = now;
      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, [isScrolling, pixelsPerSecond]);

  const rows = items.map((item) => (
    <li key={getKey(item)}>{renderItem(item)}</li>
  ));

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative min-h-0",
        prefersReducedMotion ? "overflow-y-auto" : "overflow-hidden",
        className,
      )}
      onPointerEnter={() => {
        isPausedRef.current = true;
      }}
      onPointerLeave={() => {
        isPausedRef.current = false;
      }}
    >
      <div ref={trackRef} className="flex flex-col gap-3 will-change-transform">
        <ul ref={firstCopyRef} className="flex flex-col gap-3">
          {rows}
        </ul>
        {/* A cópia existe só para a emenda do laço: leitores de tela leem a
            lista uma vez. */}
        {isScrolling && (
          <ul
            ref={secondCopyRef}
            aria-hidden="true"
            className="flex flex-col gap-3"
          >
            {rows}
          </ul>
        )}
      </div>

      {isScrolling && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface to-transparent" />
        </>
      )}
    </div>
  );
}
