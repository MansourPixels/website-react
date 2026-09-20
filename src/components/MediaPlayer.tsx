import { useRef, useState, type SyntheticEvent } from "react";

import { cancelSpeech } from "@/utils/speech";
import { canRenewUrl, classifyMediaError, isUrlStale } from "@/utils/mediaUrl";

interface MediaPlayerProps {
  src: string;
  label: string;
  /** `video` mostra a imagem e as mensagens de formato falam de vídeo; o resto é igual. */
  kind?: "audio" | "video";
  /** Pede uma URL nova; a presignada expira em 15 minutos. */
  renewUrl?: () => Promise<string>;
  /** Chamado a cada `timeupdate`, com o tempo atual em segundos. */
  onTimeUpdate?: (seconds: number) => void;
  /** Entrega o elemento (ou `null` ao desmontar) a quem precisa saltar no áudio. */
  onElement?: (element: HTMLMediaElement | null) => void;
  className?: string;
}

/**
 * O `<audio>` ou `<video>` do Revi. Três coisas que o elemento nu não faz:
 *
 * - para a leitura em voz alta antes de tocar, porque `speechSynthesis` é
 *   global e as duas vozes se sobreporiam;
 * - renova a URL presignada sem perder o lugar: ao vencer, o servidor recusa
 *   os bytes seguintes e o elemento dispara `error`; aqui a URL é trocada e o
 *   áudio volta ao mesmo segundo, tocando se estava tocando. Uma URL que falha
 *   de novo logo depois de renovada não está vencida (o arquivo sumiu ou o
 *   servidor caiu), então depois de poucas renovações seguidas mostra o erro;
 * - separa um formato que o navegador não toca (um `.mov` ou `.mkv` que não é
 *   H.264/AAC) de uma URL vencida (`classifyMediaError`): o primeiro mostra o
 *   aviso e um link para baixar o arquivo, sem tentar renovar em vão.
 */
export function MediaPlayer({
  src,
  label,
  kind = "audio",
  renewUrl,
  onTimeUpdate,
  onElement,
  className,
}: MediaPlayerProps) {
  // Só existe depois de uma renovação; antes dela vale o `src` recebido.
  const [renewedUrl, setRenewedUrl] = useState<string | null>(null);
  const url = renewedUrl ?? src;
  const [hasFailed, setHasFailed] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const elementRef = useRef<HTMLMediaElement | null>(null);
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

  const mediaProps = {
    src: url,
    controls: true,
    preload: "metadata" as const,
    "aria-label": label,
    onLoadStart: () => {
      loadedAt.current = Date.now();
    },
    onPlay: (event: SyntheticEvent<HTMLMediaElement>) => {
      cancelSpeech();

      // Começar a tocar com a URL perto de vencer trava daqui a pouco: troca antes.
      if (isUrlStale(loadedAt.current, Date.now())) {
        event.currentTarget.pause();
        void renew();
      }
    },
    onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) =>
      onTimeUpdate?.(event.currentTarget.currentTime),
    onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => {
      const pending = resumeAt.current;

      if (pending === null) return;

      resumeAt.current = null;
      event.currentTarget.currentTime = pending.time;
      if (pending.play) void event.currentTarget.play().catch(() => {});
    },
    onError: (event: SyntheticEvent<HTMLMediaElement>) => {
      const age = Date.now() - loadedAt.current;

      if (classifyMediaError(event.currentTarget.error?.code, age) === "unsupported") {
        setIsUnsupported(true);
        return;
      }

      void renew();
    },
  };

  return (
    <div className={className}>
      {kind === "video" ? (
        <video
          ref={(element) => {
            elementRef.current = element;
            onElement?.(element);
          }}
          playsInline
          className="max-h-[45vh] w-full rounded-xl bg-black"
          {...mediaProps}
        />
      ) : (
        <audio
          ref={(element) => {
            elementRef.current = element;
            onElement?.(element);
          }}
          className="w-full"
          {...mediaProps}
        />
      )}
      {isUnsupported ? (
        <div role="alert" className="text-danger mt-2 flex flex-col items-start gap-2 text-sm text-pretty">
          <p>
            Este navegador não reproduz este formato de {kind === "video" ? "vídeo" : "áudio"}. Baixe
            o arquivo para {kind === "video" ? "assistir" : "ouvir"}; o resumo, os momentos e a
            transcrição continuam disponíveis aqui.
          </p>
          <a
            href={url}
            download={label}
            className="text-accent inline-flex min-h-11 items-center underline"
          >
            Baixar o arquivo
          </a>
        </div>
      ) : null}
      {hasFailed ? (
        <p role="alert" className="text-danger mt-2 text-sm text-pretty">
          Não foi possível carregar {kind === "video" ? "o vídeo" : "o áudio"}. Volte à lista e abra
          o material de novo.
        </p>
      ) : null}
    </div>
  );
}
