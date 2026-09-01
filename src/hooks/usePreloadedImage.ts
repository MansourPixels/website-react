import { useEffect, useState } from "react";

/**
 * Espera antes de sair buscando a imagem. Arrastar na área do seletor de cor
 * dispara uma mudança por `pointermove` — sem esta pausa, um único arrasto
 * viraria uma centena de requisições à API que monta o avatar.
 */
const SETTLE_MS = 180;

/**
 * Trocar o `src` de um `<img>` apaga a imagem na hora e deixa um buraco branco
 * até a nova chegar da rede. Num playground onde cada escolha gera uma URL
 * diferente, isso viraria um piscar constante.
 *
 * Aqui a imagem é carregada fora da árvore e só entra depois do `onload`: a tela
 * segue mostrando a última que carregou até a próxima estar pronta.
 */
export function usePreloadedImage(url: string | null) {
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (url === null) return;
    if (typeof window === "undefined") return;

    let image: HTMLImageElement | null = null;
    let cancelled = false;

    function settle() {
      if (!cancelled) setLoaded(url);
    }

    // A limpeza do effect cancela este timer a cada nova URL, então só a última
    // de uma rajada chega a virar requisição.
    const timer = window.setTimeout(() => {
      image = new Image();
      image.addEventListener("load", settle);
      // Numa falha o `src` entra do mesmo jeito: aí o próprio `<img>` da tela
      // mostra o estado quebrado, em vez de ficar preso na imagem anterior.
      image.addEventListener("error", settle);
      image.src = url;
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      image?.removeEventListener("load", settle);
      image?.removeEventListener("error", settle);
    };
  }, [url]);

  return { src: loaded, isLoading: loaded !== url };
}
