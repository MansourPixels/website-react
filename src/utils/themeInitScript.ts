/**
 * Roda como `<script>` inline, síncrono, o primeiro filho de `<head>` — antes
 * de qualquer paint. É a única forma de evitar o flash do tema errado: o app
 * não tem `entry.server.tsx` próprio para decidir o tema num cookie durante o
 * SSR, então o atributo só pode ser aplicado no cliente, e tem que ser antes do
 * `<link rel="stylesheet">` do bundle terminar de bloquear a renderização.
 *
 * Não pode importar nada — é injetado como texto puro, fora do bundle. Mudar a
 * chave do `localStorage`, os valores válidos ou as cores em `themeStorage.ts`
 * exige repetir a mudança aqui manualmente.
 */
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = JSON.parse(localStorage.getItem("revi:tema") || "null");
    var pref = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var resolved = pref === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    document.documentElement.dataset.theme = resolved;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#141416" : "#f4f4f5");
  } catch (e) {}
})();`;
