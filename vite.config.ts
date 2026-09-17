import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: "autoUpdate", // Automatically updates the service worker when changes are made
      // O React Router constrói por environment para `build/client`. Sem isto o
      // plugin usa o default `dist`, e o service worker é escrito num diretório
      // que o deploy nem publica — era por isso que nada de PWA funcionava.
      outDir: "build/client",
      // Em framework mode não existe `index.html` onde injetar o script de
      // registro; ele é feito à mão em `useServiceWorker`.
      injectRegister: null,
      // O layout referencia o manifesto também durante `react-router dev`.
      // Sem isto o Vite responde o fallback HTML para essa URL, que o navegador
      // tenta interpretar como JSON e reporta como "Manifest: syntax error".
      devOptions: {
        enabled: true,
      },
      workbox: {
        // Fontes ficam de fora de propósito: as 59 variantes do KaTeX pesam
        // 1,2 MB e só servem a páginas com fórmula. Elas entram no cache no
        // primeiro uso, pela regra de runtime abaixo.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,mp3}"],
        // App com SSR não tem shell estático para servir como fallback. O
        // default do plugin aponta para `index.html`, que não existe — e o
        // `createHandlerBoundToURL` de uma URL fora do precache lança na
        // avaliação do worker, impedindo a instalação.
        navigateFallback: undefined,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // A navegação sempre tenta o servidor primeiro; o cache existe para
            // o app abrir offline em vez de cair na tela de sem conexão.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "revi-paginas",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Os arquivos são versionados no nome, então nunca ficam obsoletos.
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "revi-fontes",
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: "Revi",
        short_name: "Revi",
        lang: "pt-BR",
        description:
          "Fotografe o caderno e estude o que está nele: flash cards, resumo e simulado a partir do seu próprio material.",
        theme_color: "#0000EE",
        background_color: "#0000EE",
        display: "standalone",
        scope: "/",
        start_url: "/capturar",
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
    }),
  ],
  optimizeDeps: {
    // Nenhuma destas é alcançável a partir da primeira tela, então a varredura
    // de dependências do Vite não as encontra ao subir o servidor: ela só
    // descobre cada uma quando a rota que a importa é aberta. Cada descoberta
    // dispara uma reotimização, que troca o hash `?v=` de todos os deps já
    // pré-bundlados e faz o navegador levar 504 ("Outdated Optimize Dep") nos
    // módulos que já tinha pedido — foi o que quebrou o mapa mental, a rota
    // com o dep mais pesado e mais isolado do resto do app.
    //
    // Declaradas aqui, elas entram no pré-bundle de largada, numa passada só.
    include: [
      "@xyflow/react",
      "react-markdown",
      "remark-gfm",
      "remark-math",
      "rehype-katex",
    ],
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(import.meta.dirname, "src"),
      },
    ],
  },
});
