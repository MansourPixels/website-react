import path from "node:path";

import { defineConfig } from "vitest/config";

// Config separado de vite.config.ts de propósito: o plugin reactRouter()
// espera contexto de build/rotas que não faz sentido pra suíte de testes de
// função pura, e reaproveitar só o alias evita acoplar as duas coisas.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(import.meta.dirname, "src"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
