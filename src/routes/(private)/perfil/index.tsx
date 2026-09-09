import { Avatar, Button, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  CalendarCheck,
  Flame,
  LogOut,
  Mail,
  Pencil,
  Trophy,
  Unplug,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { resendVerificationEmail } from "@/api/auth";
import { getStreak } from "@/api/streak";
import { getWhoami } from "@/api/user";
import { NavMenu } from "@/components/NavMenu";
import { SettingToggle } from "@/components/SettingToggle";
import { SpotifyMark } from "@/components/SpotifyMark";
import { StatTile } from "@/components/StatTile";
import { ThemePicker } from "@/components/ThemePicker";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { isHapticsSupported } from "@/utils/haptics";
import { getInitials } from "@/utils/text";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const spotify = useSpotify();
  const { preferences, setPreference } = usePreferences();
  const theme = useTheme();
  const navigate = useNavigate();

  // `navigator.vibrate` não existe no servidor; checar só depois de montar
  // evita divergência entre o HTML do servidor e o primeiro render.
  const [hasHaptics, setHasHaptics] = useState(true);

  useEffect(() => {
    setHasHaptics(isHapticsSupported());
  }, []);

  const [streak, setStreak] = useState<{
    currentStreak: number;
    recordStreak: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getStreak()
      .then((result) => {
        if (!cancelled) setStreak(result);
      })
      .catch(() => {
        // Estatísticas secundárias nesta tela — uma falha aqui não deve
        // travar o resto do perfil.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getWhoami()
      .then(({ avatarUrl: stored }) => {
        if (!cancelled) setAvatarUrl(stored);
      })
      .catch(() => {
        // Sem avatar o card cai nas iniciais sozinho — não é motivo para
        // atrapalhar o resto do perfil.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [verificationState, setVerificationState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    navigate("/", { replace: true });
  }

  async function handleResendVerification() {
    setVerificationState("sending");

    try {
      await resendVerificationEmail();
      setVerificationState("sent");
    } catch {
      setVerificationState("error");
    }
  }

  if (user === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Perfil" />

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-6 shadow-surface sm:flex-row sm:items-center sm:gap-6">
        <Avatar size="lg" variant="soft" color="accent" className="shrink-0 size-26 rounded-2xl">
          {/* `null` aqui só existe enquanto o `getWhoami` inicial não resolve
              — o backend sempre entrega um avatar depois disso, então
              `Avatar.Fallback` só aparece durante esse carregamento. */}
          {avatarUrl !== null ? <Avatar.Image src={avatarUrl} alt="" /> : null}
          <Avatar.Fallback>{getInitials(user.username)}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
          <h2 className="text-xl font-semibold break-words">
            {user.username}
          </h2>
          <p className="text-muted text-sm break-all">{user.email}</p>
        </div>

        <Link
          to="/perfil/avatar"
          className={buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "shrink-0 sm:ml-auto",
          })}
        >
          <Pencil className="size-4" />
          Editar avatar
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatTile
          label="Dias em ascensão"
          value={streak !== null ? `${streak.currentStreak}` : "–"}
          hint="Sua sequência atual"
          icon={Flame}
        />
        <StatTile
          label="Recorde"
          value={streak !== null ? `${streak.recordStreak} dias` : "–"}
          hint="Sua maior sequência"
          icon={Trophy}
        />
      </section>

      <Link
        to="/ascensao"
        className={buttonVariants({
          variant: "ghost",
          className:
            "bg-surface rounded-xl shadow-surface px-5 py-4 flex items-center gap-4 h-auto w-full",
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

      <Link
        to="/amigos"
        className={buttonVariants({
          variant: "ghost",
          className:
            "bg-surface rounded-xl shadow-surface px-5 py-4 flex items-center gap-4 h-auto w-full",
        })}
      >
        <div className="size-9 rounded-xl flex items-center justify-center bg-accent text-white">
          <UserPlus className="size-5" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold">Amigos</h3>
          <p className="text-xs text-muted font-normal whitespace-normal">
            Busque colegas pelo username e responda solicitações.
          </p>
        </div>
      </Link>

      <Link
        to="/ranking"
        className={buttonVariants({
          variant: "ghost",
          className:
            "bg-surface rounded-xl shadow-surface px-5 py-4 flex items-center gap-4 h-auto w-full",
        })}
      >
        <div className="size-9 rounded-xl flex items-center justify-center bg-accent text-white">
          <Trophy className="size-5" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold">Ranking</h3>
          <p className="text-xs text-muted font-normal whitespace-normal">
            Seu XP no geral, entre amigos e por turma.
          </p>
        </div>
      </Link>

      <section className="flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-surface">
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

      <section className="bg-surface rounded-3xl shadow-surface p-4 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="font-semibold">Preferências</h2>
          <p className="text-xs text-muted text-balance">
            Como o Revi responde quando você toca na tela e conclui uma etapa.
          </p>
        </header>

        <ThemePicker value={theme.preference} onChange={theme.setPreference} />

        <SettingToggle
          label="Sons"
          description="Toca um som ao concluir simulados, flash cards e sessões."
          isSelected={preferences.soundEnabled}
          onChange={(value) => setPreference("soundEnabled", value)}
        />

        <SettingToggle
          label="Vibração"
          description={
            hasHaptics
              ? undefined
              : "Este aparelho não oferece retorno tátil no navegador."
          }
          isDisabled={!hasHaptics}
          isSelected={preferences.hapticsEnabled}
          onChange={(value) => setPreference("hapticsEnabled", value)}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        {!user.emailVerified ? (
          <Button
            variant="secondary"
            className="w-full sm:w-fit"
            isDisabled={verificationState === "sending"}
            onPress={handleResendVerification}
          >
            <Mail className="size-4" />
            {verificationState === "sent"
              ? "E-mail de verificação reenviado"
              : "Reenviar e-mail de verificação"}
          </Button>
        ) : null}

        <Button
          variant="secondary"
          className="w-full sm:w-fit"
          isDisabled={isSigningOut}
          onPress={handleSignOut}
        >
          <LogOut className="size-4" />
          Sair da conta
        </Button>
      </div>

      {!user.emailVerified && verificationState === "error" ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          Não foi possível reenviar o e-mail de verificação. Tente novamente.
        </p>
      ) : null}
    </main>
  );
}
