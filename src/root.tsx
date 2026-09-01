import { Camera, Folders, Route as PathIcon, Timer, User } from "lucide-react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import { cn } from "@heroui/styles";
import "./app.css";
import { BottomNavigation } from "./components/BottomNavigation";
import { SessionIsland } from "./components/SessionIsland";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { SessionProvider, useSession } from "./contexts/SessionContext";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { SpotifyProvider } from "./contexts/SpotifyContext";

const links = [
  {
    to: "/pastas",
    label: "Pastas",
    icon: Folders,
  },
  {
    to: "/sessao",
    label: "Sessão",
    icon: Timer,
  },
  {
    to: "/capturar",
    label: "Capturar",
    icon: Camera,
  },
  {
    to: "/trilha",
    label: "Trilha",
    icon: PathIcon,
  },
  {
    to: "/perfil",
    label: "Perfil",
    icon: User,
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f4f4f5" />

        <title>Revi - Página Inicial</title>
        <meta
          name="description"
          content="Fotografe o caderno e estude o que está nele. O Revi IA reconhece a disciplina, arquiva a foto e transforma o seu próprio material em flash cards, resumo e simulado."
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Libertinus+Math&family=Poppins:wght@300;400;500;600;800&display=swap"
          rel="stylesheet"
        />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useServiceWorker();

  return (
    <PreferencesProvider>
      <AuthProvider>
        <SpotifyProvider>
          <SessionProvider>
            <AppShell />
          </SessionProvider>
        </SpotifyProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

// Rotas fora da barra inferior que ainda devem exibi-la — acessadas a partir
// de uma aba (aqui, Ascensão a partir do Perfil), não são elas mesmas uma aba.
const extraBottomNavigationRoutes = ["/ascensao"];

// A landing tem o seu próprio cronômetro de demonstração e `/sessao` já mostra
// o cronômetro inteiro: a ilha em cima de qualquer uma das duas seria eco.
const islandFreeRoutes = ["/", "/sessao"];

function AppShell() {
  const { pathname } = useLocation();
  const { status } = useAuth();
  const session = useSession();

  const showBottomNavigation =
    status === "authenticated" &&
    (links.some(({ to }) => pathname === to) ||
      extraBottomNavigationRoutes.includes(pathname));

  // `isReady` só vira true depois da leitura do `localStorage`, no cliente —
  // é o que impede a ilha de divergir entre o HTML do servidor e a hidratação.
  const showIsland =
    status === "authenticated" &&
    session.isReady &&
    session.status !== "idle" &&
    !islandFreeRoutes.includes(pathname);

  return (
    <>
      <div
        className={cn(
          "flex flex-col min-h-full relative",
          showBottomNavigation && "pb-(--nav-inset)",
          // No mobile a ilha flutua sobre o topo da página; no desktop ela mora
          // no dock, e aí é a borda de baixo que precisa de folga.
          showIsland && "pt-(--island-inset) md:pt-0",
          showIsland && !showBottomNavigation && "md:pb-(--nav-inset)",
        )}
      >
        <Outlet />
      </div>

      {showIsland ? <SessionIsland placement="top" /> : null}

      {showBottomNavigation || showIsland ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center md:gap-3 md:px-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
          {showIsland ? <SessionIsland placement="dock" /> : null}
          {showBottomNavigation ? <BottomNavigation links={links} /> : null}
        </div>
      ) : null}
    </>
  );
}
