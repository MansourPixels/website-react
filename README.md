# Revi

> [!NOTE]  
> Versão aprimorada e atualizada do Revi. Você pode visualizar a versão inicial prototipada na branch [v1](https://github.com/MansourPixels/website-react/tree/v1) e acessá-la através do link: https://revi-v1.vercel.app.

O Revi transforma fotos de material de estudo (caderno, lousa, apostila) em flash cards,
resumos e simulados de prova, com acompanhamento de constância (Ascensão) e desempenho
(Trilha).

Deploy: **https://revi-jovi.vercel.app**

## Tecnologias utilizadas

### Front-end (este repositório)

- [React 19](https://react.dev/) com o React Compiler
- [React Router 8](https://reactrouter.com/) em modo framework (SPA, rotas por arquivo)
- [Vite 8](https://vite.dev/) com [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (instalável como PWA)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [HeroUI](https://www.heroui.com/)
- [@xyflow/react](https://reactflow.dev/) (mapa mental)
- [react-markdown](https://github.com/remarkjs/react-markdown), `remark-gfm`, `remark-math`,
  `rehype-katex` (renderização de resumos e notação matemática)
- [Vitest](https://vitest.dev/) para testes e [oxlint](https://oxc.rs/) para lint
- Integrações com a Web API do [Spotify](https://developer.spotify.com/documentation/web-api)
  e com o Google (Drive Picker e Agenda)
- Deploy na [Vercel](https://vercel.com/)

### Back-end ([`revi-back`](https://github.com/MansourPixels/revi-back))

- Java 25 com Spring Boot, build pelo Maven Wrapper
- PostgreSQL 16 (com migrations Flyway)
- RabbitMQ (fila dos processamentos de IA)
- MinIO (armazenamento das fotos e arquivos enviados)
- Keycloak (contas, login e emissão dos tokens JWT)
- API da OpenAI (leitura das fotos e geração do material de estudo)
- Docker Compose para subir a infraestrutura local

## Como instalar as dependências

Requer Node.js 22 ou superior.

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

O exemplo já aponta para a API publicada (`https://backend-revi.gioiainvestimentos.cloud`),
então basta copiá-lo para o app funcionar sem subir o back-end. As demais variáveis são
opcionais.

| Variável                 | Obrigatória | Descrição                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | Sim         | URL base da API `revi-back`: `https://backend-revi.gioiainvestimentos.cloud` (API publicada, valor do exemplo) ou `http://localhost:8080` com o back-end local                                                                                                                              |
| `VITE_SPOTIFY_CLIENT_ID` | Não         | Client ID de um app no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), usado no fluxo opcional de tocar música durante o estudo (Authorization Code + PKCE). Sem essa variável, a integração com Spotify fica desabilitada e o restante do app funciona normalmente. |
| `VITE_GOOGLE_CLIENT_ID`  | Não         | Cliente OAuth do Google Cloud Console, usado para conectar Drive e Agenda. Detalhes em [`GOOGLE.md`](GOOGLE.md).                                                                                                                                                                              |
| `VITE_GOOGLE_API_KEY`    | Não         | Chave de API restrita à Picker API. Sem ela (e sem `VITE_GOOGLE_APP_ID`), a importação do Drive não aparece.                                                                                                                                                                                 |
| `VITE_GOOGLE_APP_ID`     | Não         | Número do projeto no Google Cloud, exigido pelo Google Picker.                                                                                                                                                                                                                               |
| `VITE_GOOGLE_BACKEND`    | Não         | `true` faz o token do Google vir do `revi-back`, que guarda o refresh token cifrado. Ver [`GOOGLE.md`](GOOGLE.md).                                                                                                                                                                         |

## Como executar o projeto

Ambiente de desenvolvimento (com hot reload), em `http://127.0.0.1:5173`:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Servir o build de produção localmente em `http://127.0.0.1:4173` (mesmo comportamento do
hosting estático final, incluindo fallback de rota para as URLs dinâmicas):

```bash
npm run preview
```

Testes e lint:

```bash
npm test
npm run lint
```

## Como executar os servidores (Back-end)

O front-end depende da API [`revi-back`](https://github.com/MansourPixels/revi-back) para
login, cadastro e todas as telas internas. Há duas formas de usá-la:

- **API publicada:** `VITE_API_BASE_URL=https://backend-revi.gioiainvestimentos.cloud`, valor
  que já vem no `.env.example` (é a mesma API usada pelo deploy na Vercel). Nada precisa rodar
  localmente além do `npm run dev`.
- **API local:** siga os passos abaixo. A referência dos endpoints está em
  [`docs/API.md`](docs/API.md) e a coleção do Postman em `docs/postman/`.

Pré-requisitos: Java 25 e Docker.

1. Clone o back-end e entre na pasta:

   ```bash
   git clone https://github.com/MansourPixels/revi-back.git
   cd revi-back
   ```

2. Crie o arquivo do realm do Keycloak (o `docker compose` falha se ele não existir).
   Para os e-mails funcionarem, preencha nele a chave da [Resend](https://resend.com/)
   e o remetente; sem isso o restante funciona normalmente:

   ```bash
   cp src/test/resources/keycloak/revi-realm-resend.example.json \
      src/test/resources/keycloak/revi-realm-resend.json
   ```

3. Suba a infraestrutura (PostgreSQL em `5432`, RabbitMQ em `5672`/`15672`, MinIO em
   `9000`/`9001` e Keycloak em `8081`):

   ```bash
   docker compose up -d
   ```

4. Crie o `.env` do back-end e ajuste os valores para os do `docker-compose.yml`:

   ```bash
   cp .env.example .env
   ```

   | Variável                 | Valor local                                                   |
   | ------------------------ | ------------------------------------------------------------- |
   | `CORS_ALLOWED_ORIGINS`   | `http://127.0.0.1:5173` (a origem do `npm run dev`)           |
   | `DB_PASSWORD`            | `revi`                                                        |
   | `RABBITMQ_PASSWORD`      | `guest`                                                       |
   | `STORAGE_SECRET_KEY`     | `revi12345`                                                   |
   | `KEYCLOAK_CLIENT_SECRET` | `revi-api-backend-secret`                                     |
   | `OPENAI_API_KEY`         | sua chave da OpenAI (necessária para processar as fotos)      |

   As variáveis `GOOGLE_*` só são necessárias para a integração com Drive e Agenda.

5. Carregue o `.env` e inicie a API em `http://localhost:8080`:

   ```bash
   set -a && source .env && set +a
   ./mvnw spring-boot:run
   ```

   As migrations do banco rodam sozinhas na subida. A documentação interativa fica em
   `http://localhost:8080/swagger-ui/index.html`.

6. No front-end, use `VITE_API_BASE_URL=http://localhost:8080` e rode `npm run dev`.

## Uso de Inteligência Artificial

A IA aparece no Revi em dois lugares. **No produto**, é o centro da experiência: o
back-end envia a foto do material para um modelo de visão da OpenAI, que lê o conteúdo
(OCR), identifica disciplina e assunto para arquivar a imagem na pasta certa e, a partir
daquele material, gera os resumos, os flash cards, os simulados e os mapas mentais. Esses
processamentos rodam em fila (RabbitMQ) e são refeitos quando a pasta recebe conteúdo
novo. **No desenvolvimento**, partimos da versão inicial feita por nós (branch `v1`) e
usamos assistentes de IA como apoio para gerar os dados mockados e o seed do banco, migrar
do TanStack Router para o React Router, implementar o modo mapa mental com React Flow,
integrar a Web API do Spotify, conectar as telas às rotas do back-end a partir da
documentação da API e implementar o fluxo de autenticação e autorização com JWT. Todo o
código gerado foi revisado e ajustado pela equipe; a lista completa está em [`IA.md`](IA.md).

## Usuários e senhas necessários para teste

**No deploy da Vercel**, o cadastro é self-service: crie sua conta em
[`/auth/cadastro`](https://revi-jovi.vercel.app/auth/cadastro) informando nome de usuário,
e-mail e senha (mínimo de 8 caracteres). O cadastro já efetua login e leva ao onboarding.
Para acessar novamente depois, use [`/auth/entrar`](https://revi-jovi.vercel.app/auth/entrar)
com o e-mail e a senha cadastrados.

**Com o back-end local**, o realm importado pelo Keycloak já traz um usuário de teste:

| Usuário    | E-mail                 | Senha         |
| ---------- | ---------------------- | ------------- |
| `testuser` | `testuser@example.com` | `testuser123` |

Para ver as telas de Ascensão e Trilha com meses de histórico, o script
`scripts/seed-demo-user.sql` do `revi-back` popula os dados de um usuário (as instruções
estão no cabeçalho do arquivo).

Para administrar o Keycloak local, acesse `http://localhost:8081` com `admin` / `admin`.

## Link do Deploy na Vercel

**https://revi-jovi.vercel.app**
