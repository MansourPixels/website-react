import { useEffect } from "react";

/**
 * O `injectRegister` do vite-plugin-pwa injeta o script de registro num
 * `index.html`, que não existe em app com SSR — sem este registro explícito o
 * `sw.js` é gerado, publicado e nunca ativado.
 */
export function useServiceWorker() {
  useEffect(() => {
    // Em desenvolvimento o worker não é gerado, e registrá-lo mascararia
    // recarregamento de módulo do Vite.
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Contexto inseguro ou registro bloqueado pelo navegador: o app segue
      // funcionando, apenas sem instalação nem offline.
    });
  }, []);
}
