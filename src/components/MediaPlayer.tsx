import { useRef, useState } from "react";

import { cancelSpeech } from "@/utils/speech";
import { canRenewUrl, isUrlStale } from "@/utils/mediaUrl";

interface MediaPlayerProps {
  src: string;
  label: string;
  /** Pede uma URL nova; a presignada expira em 15 minutos. */
  renewUrl?: () => Promise<string>;
  /** Chamado a cada `timeupdate`, com o tempo atual em segundos. */
  onTimeUpdate?: (seconds: number) => void;
  /** Entrega o elemento (ou `null` ao desmontar) a quem precisa saltar no áudio. */
  onElement?: (element: HTMLAudioElement | null) => void;
  className?: string;
}

/**
 * O `<audio>` do Revi. Duas coisas que o elemento nu não faz:
 *
 * - para a leitura em voz alta antes de tocar, porque `speechSynthesis` é
 *   global e as duas vozes se sobreporiam;
 * - renova a URL presignada sem perder o lugar: ao vencer, o servidor recusa
 *   os bytes seguintes e o elemento dispara `error`; aqui a URL é trocada e o
 *   áudio volta ao mesmo segundo, tocando se estava tocando. Uma URL que falha
 *   de novo logo depois de renovada não está vencida (o arquivo sumiu ou o
 *   servidor caiu), então depois de poucas renovações seguidas mostra o erro.
 */
export function MediaPlayer({
  src,
  label,
  renewUrl,
  onTimeUpdate,
  onElement,
  className,
}: MediaPlayerProps) {
  // Só existe depois de uma renovação; antes dela vale o `src` recebido.
  const [renewedUrl, setRenewedUrl] = useState<string | null>(null);
  const url = renewedUrl ?? src;
  const [hasFailed, setHasFailed] = useState(false);
  const elementRef = useRef<HTMLAudioElement | null>(null);
  // Quando a URL atual começou a carregar (`loadstart`), para saber se vai vencer.
  const loadedAt = useRef(0);
  const renewals = useRef<number[]>([]);
  const isRenewing = useRef(false);
  const resumeAt = useRef<{ time: number; play: boolean } | null>(null);

  async function renew() {
    const element = elementRef.current;

    if (renewUrl === undefined || element === null || isRenewing.current) return;

    if (!canRenewUrl(renewals.current, Date.now())) {
      setHasFailed(true);
      return;
    }

    isRenewing.current = true;
    resumeAt.current = { time: element.currentTime, play: !element.paused };
    renewals.current.push(Date.now());

    try {
      const next = await renewUrl();

      setHasFailed(false);
      setRenewedUrl(next);
    } catch {
      resumeAt.current = null;
      setHasFailed(true);
    } finally {
      isRenewing.current = false;
    }
  }

  return (
    <div className={className}>
      <audio
        ref={(element) => {
          elementRef.current = element;
          onElement?.(element);
        }}
        src={url}
        controls
        preload="metadata"
        aria-label={label}
        className="w-full"
        onLoadStart={() => {
          loadedAt.current = Date.now();
        }}
        onPlay={(event) => {
          cancelSpeech();

          // Começar a tocar com a URL perto de vencer trava daqui a pouco: troca antes.
          if (isUrlStale(loadedAt.current, Date.now())) {
            event.currentTarget.pause();
            void renew();
          }
        }}
        onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const pending = resumeAt.current;

          if (pending === null) return;

          resumeAt.current = null;
          event.currentTarget.currentTime = pending.time;
          if (pending.play) void event.currentTarget.play().catch(() => {});
        }}
        onError={() => void renew()}
      />
      {hasFailed ? (
        <p role="alert" className="text-danger mt-2 text-sm text-pretty">
          Não foi possível carregar o áudio. Volte à lista e abra o material de
          novo.
        </p>
      ) : null}
    </div>
  );
}
