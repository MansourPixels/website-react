import { useEffect, useState } from "react";

function getMatches(query: string) {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

/**
 * Lê uma media query em JavaScript, para os casos em que o contexto do
 * dispositivo muda o *comportamento* e não só o layout. Layout continua sendo
 * trabalho do CSS.
 *
 * O valor inicial é calculado de forma síncrona, então a primeira renderização
 * já sai correta e não pisca a composição errada.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

/**
 * O aparelho tem ponteiro grosso (dedo ou caneta) como entrada principal?
 *
 * Isto é a pergunta certa para a captura: quem tem dedo tem, quase sempre, uma
 * câmera traseira boa apontável para o caderno. Quem tem mouse tem webcam
 * frontal, que é ruim para fotografar papel — mas tem arquivos, arrastar e
 * soltar, e Ctrl+V.
 */
export function useTouchPrimary() {
  return useMediaQuery("(pointer: coarse)");
}
