import type { MetaDescriptor } from "react-router";

const BRAND = "Revi";

interface PageMetaOptions {
  /** Sem o sufixo da marca: ele é acrescentado aqui. */
  title: string;
  description: string;
  /**
   * Só as três páginas que existem para quem ainda não tem conta — a landing,
   * a política e os termos. O resto é tela de app: o deploy é estático e
   * devolve o mesmo `index.html` para qualquer caminho, então sem o `noindex`
   * um buscador acabaria listando "/perfil" ou um link de convite de turma.
   */
  indexable?: boolean;
}

/**
 * Monta o retorno do `meta()` de uma rota. O React Router substitui os metadados
 * do pai pelos do filho em vez de mesclar, então cada página precisa repetir
 * título e descrição — é o que esta função evita copiar em trinta e poucos
 * arquivos.
 *
 * As rotas com parâmetro ficam com título genérico ("Turma", "Plano de
 * estudos"): o nome real vem de uma chamada de API dentro do componente, e o
 * `meta()` roda antes disso. Para usar o nome no título seria preciso mover a
 * busca para um `clientLoader`.
 */
export function pageMeta({
  title,
  description,
  indexable = false,
}: PageMetaOptions): MetaDescriptor[] {
  const fullTitle = `${title} — ${BRAND}`;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    ...(indexable
      ? [
          { property: "og:type", content: "website" },
          { property: "og:site_name", content: BRAND },
          { property: "og:title", content: fullTitle },
          { property: "og:description", content: description },
        ]
      : [{ name: "robots", content: "noindex" }]),
  ];
}

/**
 * Os metadados da landing moram aqui porque servem a dois arquivos: a rota
 * `/` e o `meta()` do root. O segundo é o que entra no `index.html` do SPA —
 * o HTML que o host devolve para `/` e para toda rota não prerenderizada —,
 * e é ele que um rastreador ou uma prévia de link lê antes de haver JS.
 */
export const LANDING_META = {
  title: "Estude pelo seu próprio caderno",
  description:
    "Fotografe o caderno e estude o que está nele: o Revi reconhece a disciplina, arquiva a foto e transforma o seu material em flash cards, resumo, simulado e mapa mental.",
  indexable: true,
} satisfies PageMetaOptions;
