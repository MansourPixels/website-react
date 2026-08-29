# Revi - v1

> [!NOTE]  
> Versão inicial do projeto Revi apenas convertido para React. Você pode acessá-la através do link: https://revi-v1.vercel.app/

O Revi transforma fotos de material de estudo (caderno, lousa, apostila) em flash cards,
resumos e simulados de prova, com acompanhamento de constância (Ascensão) e desempenho
(Trilha).

## Tecnologias utilizadas

- [React 19](https://react.dev/) com o React Compiler
- [Tanstack Router](https://tanstack.com/router/latest) em modo framework (SSR, rotas por arquivo)
- [Vite 8](https://vite.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [HeroUI](https://www.heroui.com/)
- [oxlint](https://oxc.rs/) para lint
- Deploy na [Vercel](https://vercel.com/)

## Como instalar as dependências

```bash
npm install
```

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
