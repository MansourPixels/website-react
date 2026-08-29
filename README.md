# Revi

> [!NOTE]  
> Versão aprimorada e atualizada do Revi. Você pode visualizar a versão inicial prototipada na branch [v1](https://github.com/MansourPixels/website-react/tree/v1).

O Revi transforma fotos de material de estudo (caderno, lousa, apostila) em flash cards,
resumos e simulados de prova, com acompanhamento de constância (Ascensão) e desempenho
(Trilha).

Deploy: **https://revi-jovi.vercel.app**

## Tecnologias utilizadas

- [React 19](https://react.dev/) com o React Compiler
- [React Router 8](https://reactrouter.com/) em modo framework (SSR, rotas por arquivo)
- [Vite 8](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [HeroUI](https://www.heroui.com/)
- [@xyflow/react](https://reactflow.dev/) (mapa mental)
- [react-markdown](https://github.com/remarkjs/react-markdown), `remark-gfm`, `remark-math`,
  `rehype-katex` (renderização de resumos e notação matemática)
- [oxlint](https://oxc.rs/) para lint
- Deploy na [Vercel](https://vercel.com/)

## Pré-requisitos

- A API do Revi ([`revi_back`](https://github.com/MansourPixels/revi-back)) rodando localmente para login, cadastro e demais chamadas
  autenticadas — veja `docs/API.md` para a referência completa dos endpoints. Sem ela, as
  telas atrás de login não conseguem autenticar.

## Como instalar as dependências

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo e ajuste os valores conforme seu ambiente:

```bash
cp .env.example .env
```

| Variável                 | Obrigatória | Descrição                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | Sim         | URL base da API `revi_back` (ex.: `http://localhost:8080`)                                                                                                                                                                                                                                   |
| `VITE_SPOTIFY_CLIENT_ID` | Não         | Client ID de um app no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), usado no fluxo opcional de tocar música durante o estudo (Authorization Code + PKCE). Sem essa variável, a integração com Spotify fica desabilitada e o restante do app funciona normalmente. |

## Como executar o projeto

Ambiente de desenvolvimento (com hot reload), em `http://127.0.0.1:5173`:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Servir o build de produção localmente:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Usuários e senhas necessários para teste

Não há usuários fixos: o cadastro é self-service. Crie sua própria conta em `/cadastro`
informando e-mail, nome de usuário e senha (mínimo 8 caracteres) — o cadastro já efetua login
automaticamente. Para acessar novamente depois, use `/entrar` com o e-mail e a senha
cadastrados.

## Link do Deploy na Vercel

**https://revi-jovi.vercel.app**
