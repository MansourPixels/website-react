import { GoogleConnectCard } from "@/components/GoogleConnectCard";
import { SpotifyStrip } from "@/components/SpotifyStrip";
import { useGoogle } from "@/contexts/GoogleContext";
import { useSpotify } from "@/contexts/SpotifyContext";

interface StepConexoesProps {
  /** Caminho completo de volta, com a query intacta. Ver `index.tsx`. */
  returnTo: string;
}

/**
 * Nenhum cartão novo: os dois canônicos do design system entram como estão. O
 * `GoogleConnectCard` já é autocontido; o `SpotifyStrip` é presentacional e só
 * precisa do `onConnect`.
 *
 * Conectar nunca é exigido para avançar — são serviços de terceiros, e o Revi
 * funciona inteiro sem eles.
 */
export function StepConexoes({ returnTo }: StepConexoesProps) {
  const spotify = useSpotify();
  const google = useGoogle();

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">
          Conecte o que você já usa
        </h1>
        <p className="text-muted text-sm text-pretty">
          Os dois são opcionais e podem ser conectados depois, no Perfil.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <SpotifyStrip
          status={spotify.status}
          profile={spotify.profile}
          nowPlaying={spotify.nowPlaying}
          issue={spotify.issue}
          retryAfter={spotify.retryAfter}
          isConfigured={spotify.isConfigured}
          // O Spotify sai da página inteira (`window.location.assign`), então o
          // caminho de volta precisa carregar a etapa e o destino final.
          onConnect={() => void spotify.connect(returnTo)}
          onRetry={() => void spotify.refreshNowPlaying()}
        />

        <GoogleConnectCard />
      </div>

      <p className="text-muted text-xs text-pretty">
        {google.isConfigured || spotify.isConfigured
          ? "O Spotify toca durante o foco da sessão de estudo. O Google importa material do Drive e põe as suas entregas na Agenda."
          : "Nenhuma integração está configurada neste ambiente."}
      </p>
    </>
  );
}
