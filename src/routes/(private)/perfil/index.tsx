import { Button, Spinner } from "@heroui/react";
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
import { Link } from "react-router";

import { resendVerificationEmail } from "@/api/auth";
import { ApiError } from "@/api/client";
import { getStreak } from "@/api/streak";
import { getWhoami } from "@/api/user";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { SettingToggle } from "@/components/SettingToggle";
import { SpotifyMark } from "@/components/SpotifyMark";
import { StatTile } from "@/components/StatTile";
import { ThemePicker } from "@/components/ThemePicker";
import { UserIdentity } from "@/components/UserIdentity";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { isHapticsSupported } from "@/utils/haptics";
import { DialogSignOut } from "./components/DialogSignOut";

export default function PerfilPage() {
  const { user } = useAuth();
  const spotify = useSpotify();
  const { preferences, setPreference } = usePreferences();
  const theme = useTheme();

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
  const [streakError, setStreakError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setStreak(null);
    setStreakError(null);

    getStreak()
      .then((result) => {
        if (!cancelled) setStreak(result);
      })
      .catch((error) => {
        // A falha não trava o resto do perfil, mas precisa aparecer: um traço
        // permanente nos indicadores se lê como "você não tem sequência".
        if (cancelled) return;

        setStreakError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar a sua sequência.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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

  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [verificationState, setVerificationState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

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

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-4 shadow-surface sm:flex-row sm:gap-6">
        {/* O token de acesso não carrega nome de exibição; `UserIdentity` cai
            no username sozinho. `avatarUrl` fica vazio enquanto o `getWhoami`
            inicial não resolve, e aí o componente mostra as iniciais. */}
        <UserIdentity
          user={{
            id: user.id,
            username: user.username,
            displayName: "",
            avatarUrl: avatarUrl ?? "",
            xp: 0,
          }}
          caption={user.email}
        />

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

      {streakError !== null ? (
        <ErrorState isCompact onRetry={() => setReloadKey((k) => k + 1)}>
          {streakError}
        </ErrorState>
      ) : (
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
      )}

      <Link
        to="/ascensao"
        className={buttonVariants({
          variant: "ghost",
          className:
            "bg-surface rounded-lg shadow-surface p-3 flex items-center gap-4 h-auto w-full",
        })}
      >
        <div className="size-9 rounded-lg flex items-center justify-center bg-accent text-accent-foreground">
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
            "bg-surface rounded-lg shadow-surface p-3 flex items-center gap-4 h-auto w-full",
        })}
      >
        <div className="size-9 rounded-lg flex items-center justify-center bg-accent text-accent-foreground">
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
            "bg-surface rounded-lg shadow-surface p-3 flex items-center gap-4 h-auto w-full",
        })}
      >
        <div className="size-9 rounded-lg flex items-center justify-center bg-accent text-accent-foreground">
          <Trophy className="size-5" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold">Ranking</h3>
          <p className="text-xs text-muted font-normal whitespace-normal">
            Seu XP no geral, entre amigos e por turma.
          </p>
        </div>
      </Link>

      <section className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-surface">
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
            isPending={verificationState === "sending"}
            // O rótulo não muda para "reenviado": o resultado é anunciado no
            // `role="status"` abaixo, e o botão só sai do ar depois do envio.
            isDisabled={verificationState === "sent"}
            onPress={handleResendVerification}
          >
            <Mail className="size-4" />
            Reenviar e-mail de verificação
          </Button>
        ) : null}

        <Button
          variant="secondary"
          className="w-full sm:w-fit"
          onPress={() => setIsSignOutOpen(true)}
        >
          <LogOut className="size-4" />
          Sair da conta
        </Button>
      </div>

      {!user.emailVerified && verificationState === "sent" ? (
        <p role="status" className="text-muted text-sm text-pretty">
          E-mail de verificação reenviado. Confira a sua caixa de entrada.
        </p>
      ) : null}

      {!user.emailVerified && verificationState === "error" ? (
        <p role="alert" className="text-danger-soft-foreground text-sm text-pretty">
          Não foi possível reenviar o e-mail de verificação. Tente novamente.
        </p>
      ) : null}

      <DialogSignOut isOpen={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
    </main>
  );
}
