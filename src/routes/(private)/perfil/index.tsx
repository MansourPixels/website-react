import { Avatar, Button, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { CalendarCheck, Flame, LogOut, Trophy, Unplug } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { NavMenu } from "@/components/NavMenu";
import { SpotifyMark } from "@/components/SpotifyMark";
import { StatTile } from "@/components/StatTile";
import { useAuth } from "@/contexts/AuthContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { ascension } from "@/mocks/ascension";
import { getInitials } from "@/utils/text";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const spotify = useSpotify();
  const navigate = useNavigate();

  const { currentStreak, recordStreak } = ascension;

  function handleSignOut() {
    signOut();
    navigate("/", { replace: true });
  }

  if (user === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Perfil" />

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-surface sm:flex-row sm:items-center sm:gap-6">
        <Avatar size="lg" variant="soft" color="accent" className="shrink-0">
          <Avatar.Fallback>{getInitials(user.name)}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold wrap-break-word">{user.name}</h2>
          <p className="text-muted text-sm break-all">{user.email}</p>
          <p className="text-muted text-sm">Conta local neste dispositivo</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Ascensão</h2>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Dias em ascensão"
            value={`${currentStreak}`}
            hint="Sua sequência atual"
            icon={Flame}
          />
          <StatTile
            label="Recorde"
            value={`${recordStreak} dias`}
            hint="Sua maior sequência"
            icon={Trophy}
          />
        </div>

        <Link
          to="/ascensao"
          className={buttonVariants({
            variant: "ghost",
            className:
              "bg-white rounded-xl shadow-surface px-5 py-4 flex items-center gap-4 h-auto w-full",
          })}
        >
          <div className="size-9 rounded-xl flex items-center justify-center bg-accent text-white">
            <CalendarCheck className="size-5" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold">Ver a sua ascensão</h3>
            <p className="text-xs text-muted font-normal whitespace-normal">
              Calendário, marcos e congelamentos da sua sequência.
            </p>
          </div>
        </Link>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-surface">
        <header className="flex items-center gap-3">
          <SpotifyMark />
          <div className="flex min-w-0 flex-col">
            <h2 className="font-semibold">Spotify</h2>
            <p className="text-muted text-sm text-pretty">
              Toca a sua música durante o foco e para nas pausas da sessão de
              estudos.
            </p>
          </div>
        </header>

        {spotify.status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" />
            Verificando a conexão…
          </p>
        ) : null}

        {spotify.status === "connected" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Conectado como{" "}
              <strong className="font-medium">
                {spotify.profile?.displayName}
              </strong>
              .
            </p>

            {spotify.profile?.isPremium === false ? (
              <p className="text-muted text-sm text-pretty">
                O controle de reprodução é um recurso do Spotify Premium. A
                conta está conectada, mas o Revi não consegue dar play.
              </p>
            ) : null}

            <Button
              variant="secondary"
              className="w-full sm:w-fit"
              onPress={spotify.disconnect}
            >
              <Unplug className="size-4" />
              Desconectar Spotify
            </Button>
          </div>
        ) : null}

        {spotify.status === "disconnected" || spotify.status === "connecting" ? (
          spotify.isConfigured ? (
            <Button
              variant="secondary"
              className="w-full sm:w-fit"
              isPending={spotify.status === "connecting"}
              onPress={() => void spotify.connect("/perfil")}
            >
              Conectar Spotify
            </Button>
          ) : (
            <p className="text-muted text-sm">
              Configuração do Spotify ausente neste ambiente.
            </p>
          )
        ) : null}
      </section>

      <Button
        variant="secondary"
        className="w-full sm:w-fit"
        onPress={handleSignOut}
      >
        <LogOut className="size-4" />
        Sair da conta
      </Button>
    </main>
  );
}
