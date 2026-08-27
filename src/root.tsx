import {
  Camera,
  Folders,
  Route as PathIcon,
  Timer,
  User,
} from "lucide-react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router";

import { cn } from "@heroui/styles";
import { BottomNavigation } from "./components/BottomNavigation";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SpotifyProvider } from "./contexts/SpotifyContext";
import "./app.css";

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
  return (
    <AuthProvider>
      <SpotifyProvider>
        <AppShell />
      </SpotifyProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const { status } = useAuth();

  const showBottomNavigation =
    status === "authenticated" && links.some(({ to }) => pathname === to);

  return (
    <>
      <div
        className={cn(
          "flex flex-col min-h-full relative",
          showBottomNavigation && "pb-[var(--nav-inset)]",
        )}
      >
        <Outlet />
      </div>
      {showBottomNavigation ? <BottomNavigation links={links} /> : null}
    </>
  );
}
