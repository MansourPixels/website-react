// Os dois SDKs do Google só existem como <script> de origem externa. Nenhum
// deles entra no <head> de `root.tsx`: a integração é opcional, e as telas que
// não a usam não podem pagar por ela. A promise fica guardada em módulo para o
// carregamento ser idempotente sob StrictMode — mesma disciplina do
// `pendingRefresh` de `spotifyAuth.ts`.
//
// Nenhuma das duas origens entra no Workbox: script de autenticação em cache é
// risco, não otimização.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const GAPI_SRC = "https://apis.google.com/js/api.js";

const pending = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Sem DOM para carregar o SDK do Google."));
  }

  const cached = pending.get(src);

  if (cached !== undefined) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existing !== null) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Falha ao carregar ${src}`)),
        { once: true },
      );

      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        // Sai do cache: uma queda de rede não pode condenar todas as próximas
        // tentativas a reusar a mesma promise rejeitada.
        pending.delete(src);
        script.remove();
        reject(new Error(`Falha ao carregar ${src}`));
      },
      { once: true },
    );

    document.head.append(script);
  });

  pending.set(src, promise);

  return promise;
}

export function loadIdentityServices(): Promise<void> {
  return loadScript(GIS_SRC);
}

let pickerPromise: Promise<void> | null = null;

/** Carrega o `gapi` e, dentro dele, o módulo do Picker. */
export function loadPicker(): Promise<void> {
  pickerPromise ??= (async () => {
    await loadScript(GAPI_SRC);

    await new Promise<void>((resolve) => {
      gapi.load("picker", () => resolve());
    });
  })().catch((error: unknown) => {
    pickerPromise = null;

    throw error;
  });

  return pickerPromise;
}
