// O resumo vem com LaTeX delimitado ao estilo \( ... \) / \[ ... \], mas
// remark-math só reconhece $ ... $ / $$ ... $$ — converte antes de renderizar.
export function normalizeLatexDelimiters(markdown: string) {
  return markdown
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, expression: string) => `$$${expression}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, expression: string) => `$${expression}$`);
}
