import { useEffect, useRef, useState } from "react";

import { AdminForbiddenError } from "@/api/admin";
import { ApiError } from "@/api/client";

export type AdminResource<T> =
  | { state: "loading" }
  | { state: "ready"; value: T }
  | { state: "error"; message: string };

/**
 * Um bloco de uma tela de admin que carrega sozinho: a falha de um não apaga os
 * outros. Busca de novo quando `key` muda (o período, por exemplo) e cancela a
 * busca anterior. Um `403` não vira erro aqui, porque o layout já troca a página
 * por "Acesso restrito". `retry` volta a carregar.
 */
export function useAdminResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  fallback: string,
  key: string,
): [AdminResource<T>, () => void] {
  const [resource, setResource] = useState<AdminResource<T>>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadedKey, setLoadedKey] = useState(key);
  const loader = useRef({ load, fallback });

  // Declarado antes do efeito de carga: os efeitos rodam na ordem, então a carga
  // sempre usa o carregador do render mais recente.
  useEffect(() => {
    loader.current = { load, fallback };
  });

  // Trocar a chave mostra o carregamento já neste render, sem um frame com o valor antigo.
  if (loadedKey !== key) {
    setLoadedKey(key);
    setResource({ state: "loading" });
  }

  useEffect(() => {
    const controller = new AbortController();

    loader.current
      .load(controller.signal)
      .then((value) => setResource({ state: "ready", value }))
      .catch((error) => {
        if (controller.signal.aborted || error instanceof AdminForbiddenError) return;
        setResource({
          state: "error",
          message: error instanceof ApiError ? error.detail : loader.current.fallback,
        });
      });

    return () => controller.abort();
  }, [key, attempt]);

  const retry = () => {
    setResource({ state: "loading" });
    setAttempt((value) => value + 1);
  };

  return [resource, retry];
}
