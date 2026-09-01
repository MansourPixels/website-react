import type { HapticPattern } from "./haptics";

export type FeedbackEvent =
  | "camera-obturador"
  | "camera-foco"
  | "flashcard-virar"
  | "flashcard-facil"
  | "flashcard-medio"
  | "flashcard-dificil"
  | "flashcards-concluido"
  | "simulado-resposta-correta"
  | "simulado-resposta-incorreta"
  | "simulado-concluido"
  | "mapa-ramo-abrir"
  | "mapa-concluido"
  | "sessao-foco-concluido"
  | "sessao-pausa-concluida"
  | "sessao-ciclo-concluido"
  | "trilha-etapa-concluida"
  | "trilha-plano-concluido"
  | "conquista"
  | "dia-de-ouro"
  | "sucesso"
  | "erro"
  | "exclusao";

interface FeedbackDefinition {
  /** Nome do arquivo em `public/audios`, sem a extensão. */
  sound?: string;
  haptic?: HapticPattern;
}

/**
 * Fonte única de verdade do retorno. Trocar o som de uma ação é editar uma
 * linha aqui; nenhum outro arquivo conhece nomes de áudio.
 *
 * Som fica reservado a marcos e às interações-assinatura do produto — a
 * vibração de toque comum é global e não passa por esta tabela.
 */
export const FEEDBACK: Record<FeedbackEvent, FeedbackDefinition> = {
  "camera-obturador": { sound: "obturador", haptic: "impact" },
  "camera-foco": { haptic: "tap" },

  "flashcard-virar": { sound: "card-virar", haptic: "impact" },
  "flashcard-facil": { sound: "dificuldade-facil", haptic: "tap" },
  "flashcard-medio": { sound: "dificuldade-medio", haptic: "tap" },
  "flashcard-dificil": { sound: "dificuldade-dificil", haptic: "tap" },
  "flashcards-concluido": { sound: "flash-cards-concluido", haptic: "success" },

  "simulado-resposta-correta": { sound: "resposta-correta" },
  "simulado-resposta-incorreta": { sound: "resposta-incorreta" },
  "simulado-concluido": { sound: "simulado-concluido", haptic: "success" },

  "mapa-ramo-abrir": { sound: "ramo-abrir", haptic: "tap" },
  "mapa-concluido": { sound: "mapa-concluido", haptic: "success" },

  "sessao-foco-concluido": { sound: "foco-concluido", haptic: "success" },
  "sessao-pausa-concluida": { sound: "pausa-concluida", haptic: "tap" },
  "sessao-ciclo-concluido": { sound: "ciclo-concluido", haptic: "achievement" },

  "trilha-etapa-concluida": { sound: "etapa-concluida", haptic: "success" },
  "trilha-plano-concluido": { sound: "plano-concluido", haptic: "achievement" },

  conquista: { sound: "conquista", haptic: "achievement" },
  "dia-de-ouro": { sound: "dia-de-ouro", haptic: "achievement" },

  sucesso: { sound: "sucesso", haptic: "success" },
  erro: { sound: "erro", haptic: "error" },
  exclusao: { sound: "exclusao", haptic: "impact" },
};

/**
 * Todo o kit soma poucas dezenas de KB, então não há motivo para carregar sob
 * demanda: a primeira reprodução de um som ainda não decodificado embute a
 * latência da rede, e retorno atrasado é pior que retorno ausente.
 */
export const ALL_SOUNDS = [
  ...new Set(
    Object.values(FEEDBACK)
      .map(({ sound }) => sound)
      .filter((sound): sound is string => sound !== undefined),
  ),
];
