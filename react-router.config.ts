import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  // Em SPA o build gera um `index.html` só, com os metadados do root dentro,
  // servido para qualquer caminho: quem não roda JS — rastreador de busca,
  // prévia de link no WhatsApp — vê sempre o mesmo título. Estas duas páginas
  // ganham HTML próprio, com o texto inteiro já dentro, porque são as que
  // precisam ser lidas por quem ainda não tem conta.
  //
  // A landing ficou de fora por duas razões. Prerenderizar `/` moveria o
  // fallback do SPA de `index.html` para `__spa-fallback.html`, e cada rota
  // não prerenderizada passaria a depender de o host saber disso. E renderia
  // pouco: sem sessão para ler, o corpo prerenderizado da landing é o spinner
  // de "Verificando sua sessão". O que ela tem de útil para um rastreador são
  // os metadados, e esses já vão no `index.html` — é o `meta()` do root, que
  // usa o mesmo `LANDING_META` da página.
  prerender: ["/politica-privacidade", "/termos-uso"],
} satisfies Config;
