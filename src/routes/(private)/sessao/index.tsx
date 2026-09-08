import { useEffect, useState } from "react";

import { NavMenu } from "@/components/NavMenu";
import { SessionTimer } from "@/components/SessionTimer";
import { SpotifyStrip } from "@/components/SpotifyStrip";
import { useSession } from "@/contexts/SessionContext";
import { useSpotify } from "@/contexts/SpotifyContext";
import { formatCountdown, phaseLabels } from "@/hooks/useStudySession";
import type { SessionSettings } from "@/types/StudySession";
import { DialogSessionSettings } from "./components/DialogSessionSettings";

export default function SessaoPage() {
  const session = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const spotify = useSpotify();

  // O provider só consulta o que está tocando com a sessão em andamento; aqui
  // a faixa aparece na tela mesmo parado, então a página pede o seu watcher.
  const { watchPlayback } = spotify;

  useEffect(() => watchPlayback(), [watchPlayback]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousTitle = document.title;

    document.title =
      session.status === "running"
        ? `${formatCountdown(session.remainingMs)} · ${phaseLabels[session.phase]} — Revi`
        : "Revi - Sessão de estudos";

    return () => {
      document.title = previousTitle;
    };
  }, [session.status, session.remainingMs, session.phase]);

  function handleSaveSettings(settings: SessionSettings) {
    session.updateSettings(settings);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Sessão" />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <SessionTimer
          phase={session.phase}
          status={session.status}
          remainingMs={session.remainingMs}
          totalMs={session.totalMs}
          completedFocus={session.completedFocus}
          cycleInRound={session.cycleInRound}
          cyclesUntilLongBreak={session.settings.cyclesUntilLongBreak}
          announcement={session.announcement}
          onToggle={session.toggle}
          onReset={session.reset}
          onSkip={session.skip}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SpotifyStrip
          status={spotify.status}
          profile={spotify.profile}
          nowPlaying={spotify.nowPlaying}
          issue={spotify.issue}
          retryAfter={spotify.retryAfter}
          isConfigured={spotify.isConfigured}
          controlsSpotify={session.settings.controlsSpotify}
          onToggleControl={(controlsSpotify) =>
            session.updateSettings({ controlsSpotify })
          }
          onConnect={() => void spotify.connect("/sessao")}
          onRetry={() => void spotify.refreshNowPlaying()}
        />
      </div>

      <DialogSessionSettings
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={session.settings}
        onSubmit={handleSaveSettings}
        onRestoreDefaults={session.restoreDefaults}
        isSpotifyConnected={spotify.status === "connected"}
      />
    </main>
  );
}
