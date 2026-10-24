import { useEffect } from "react";

/**
 * Pede ao navegador para não apagar a tela enquanto a página estiver aberta —
 * pensado para telas transmitidas numa TV, em que ninguém mexe no mouse.
 *
 * O navegador solta a trava sozinho quando a aba fica oculta, então ela é
 * pedida de novo a cada volta. Sem suporte ou sem permissão, a página segue
 * normal: a tela só pode apagar, como já aconteceria.
 */
export function useScreenWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request("screen");

        if (disposed) {
          void lock.release();
          return;
        }

        sentinel = lock;
      } catch {
        // Bateria fraca, aba em segundo plano ou política do navegador.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void sentinel?.release();
    };
  }, [enabled]);
}
