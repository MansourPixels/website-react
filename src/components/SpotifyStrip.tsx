import { Button, Label, Spinner, Switch } from "@heroui/react";
import { MonitorSpeaker } from "lucide-react";

import { SpotifyMark } from "@/components/SpotifyMark";
import type {
  SpotifyIssue,
  SpotifyNowPlaying,
  SpotifyProfile,
  SpotifyStatus,
} from "@/types/Spotify";

function issueMessage(issue: SpotifyIssue, retryAfter: number | null) {
  switch (issue) {
    case "noDevice":
      return "Abra o Spotify em algum aparelho e toque qualquer música para o Revi assumir o controle.";
    case "notPremium":
      return "O controle de reprodução é um recurso do Spotify Premium. Sua conta está conectada, mas o Revi não consegue dar play.";
    case "rateLimited":
      return `O Spotify pediu uma pausa. Tentando de novo em ${retryAfter ?? 5}s.`;
    case "requestFailed":
      return "Não deu para falar com o Spotify agora. O cronômetro segue normalmente.";
    default:
      return null;
  }
}

interface SpotifyStripProps {
  status: SpotifyStatus;
  profile: SpotifyProfile | null;
  nowPlaying: SpotifyNowPlaying | null;
  issue: SpotifyIssue;
  retryAfter?: number | null;
  isConfigured: boolean;
  controlsSpotify?: boolean;
  onToggleControl?: (controlsSpotify: boolean) => void;
  onConnect?: () => void;
  onRetry?: () => void;
}

export function SpotifyStrip({
  status,
  profile,
  nowPlaying,
  issue,
  retryAfter = null,
  isConfigured,
  controlsSpotify = true,
  onToggleControl,
  onConnect,
  onRetry,
}: SpotifyStripProps) {
  const message = issueMessage(issue, retryAfter);

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-surface">
      {status === "loading" ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" />
          Verificando a conexão…
        </p>
      ) : null}

      {status !== "loading" && status !== "connected" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <SpotifyMark />
            <p className="text-sm text-pretty">
              {isConfigured
                ? "Conecte o Spotify para tocar sua música durante o foco."
                : "Configuração do Spotify ausente neste ambiente."}
            </p>
          </div>

          {isConfigured && onConnect !== undefined ? (
            <Button
              variant="secondary"
              className="w-full sm:w-fit"
              isPending={status === "connecting"}
              onPress={onConnect}
            >
              Conectar Spotify
            </Button>
          ) : null}
        </div>
      ) : null}

      {status === "connected" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {nowPlaying?.albumImageUrl != null ? (
              <img
                src={nowPlaying.albumImageUrl}
                alt=""
                className="size-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-default">
                <SpotifyMark className="size-5" />
              </span>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="line-clamp-1 text-sm font-medium">
                {nowPlaying?.trackName ?? "Nada tocando agora"}
              </p>
              <p className="line-clamp-1 text-xs text-muted">
                {nowPlaying?.artistName !== undefined &&
                nowPlaying.artistName.length > 0
                  ? nowPlaying.artistName
                  : (profile?.displayName ?? "Spotify conectado")}
              </p>
              {nowPlaying?.deviceName != null ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MonitorSpeaker className="size-3.5" />
                  {nowPlaying.deviceName}
                </p>
              ) : null}
            </div>
          </div>

          {onToggleControl !== undefined ? (
            <Switch
              isSelected={controlsSpotify}
              onChange={onToggleControl}
              className="w-full"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label>Controlar a música</Label>
              </Switch.Content>
            </Switch>
          ) : null}
        </div>
      ) : null}

      {message !== null ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted text-pretty">{message}</p>
          {issue === "noDevice" && onRetry !== undefined ? (
            <Button variant="ghost" size="sm" onPress={onRetry}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
