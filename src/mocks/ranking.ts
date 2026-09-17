import type { RankingEntry } from "@/types/api/ranking";
import { buildAvatarUrl, type AvatarConfig } from "@/utils/avatar";
import { xpFromActivity } from "@/utils/ranking";

/**
 * Ranking de demonstração da landing: uma turma fictícia, com meninos e
 * meninas alternados, para a seção não parecer uma lista de uma pessoa só.
 *
 * O avatar sai de `buildAvatarUrl`, o mesmo do editor de perfil — nada de URL
 * escrita à mão aqui: se o catálogo de peças mudar, estas linhas acompanham. O
 * XP vem de `xpFromActivity`, para o número bater com a contagem exibida na
 * linha.
 */
const activity: {
  username: string;
  displayName: string;
  flashcards: number;
  quizzes: number;
  avatar: AvatarConfig;
}[] = [
  {
    username: "helena.duarte",
    displayName: "Helena Duarte",
    flashcards: 62,
    quizzes: 18,
    avatar: {
      accessories: null,
      eyes: "cheery",
      hair: "braids",
      mouth: "openedSmile",
      hairColor: "220f00",
      skinColor: "8c5a2b",
      backgroundColor: "ff5d8f",
    },
  },
  {
    username: "rafael.moreira",
    displayName: "Rafael Moreira",
    flashcards: 48,
    quizzes: 16,
    avatar: {
      accessories: "glasses",
      eyes: "normal",
      hair: "shortHair",
      mouth: "teethSmile",
      hairColor: "3a1a00",
      skinColor: "c99c62",
      backgroundColor: "4d96ff",
    },
  },
  {
    username: "beatriz.lima",
    displayName: "Beatriz Lima",
    flashcards: 55,
    quizzes: 12,
    avatar: {
      accessories: null,
      eyes: "starstruck",
      hair: "curlyBob",
      mouth: "braces",
      hairColor: "71472d",
      skinColor: "efcc9f",
      backgroundColor: "b57bff",
    },
  },
  {
    username: "caio.tavares",
    displayName: "Caio Tavares",
    flashcards: 39,
    quizzes: 11,
    avatar: {
      accessories: null,
      eyes: "winking",
      hair: "curlyShortHair",
      mouth: "gapSmile",
      hairColor: "220f00",
      skinColor: "643d19",
      backgroundColor: "43aa8b",
    },
  },
  {
    username: "marina.ribeiro",
    displayName: "Marina Ribeiro",
    flashcards: 31,
    quizzes: 9,
    avatar: {
      accessories: "sunglasses",
      eyes: "normal",
      hair: "bunHair",
      mouth: "kwaii",
      hairColor: "e9b729",
      skinColor: "ffe4c0",
      backgroundColor: "ffb703",
    },
  },
];

/** A quarta linha é a do usuário atual, para a borda de estado aparecer. */
const currentUserIndex = 3;

export const defaultRanking: RankingEntry[] = activity.map((person, index) => {
  const xp = xpFromActivity(person);

  return {
    position: index + 1,
    user: {
      id: `ranking-${index + 1}`,
      username: person.username,
      displayName: person.displayName,
      avatarUrl: buildAvatarUrl(person.avatar),
      xp,
    },
    xp,
    flashcards: person.flashcards,
    quizzes: person.quizzes,
    isCurrentUser: index === currentUserIndex,
  };
});
