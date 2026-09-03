import {
  DEFAULT_AVATAR_CONFIG,
  buildAvatarUrl,
  defaultBackgroundColors,
  defaultHairColors,
  defaultSkinColors,
  type EyesVariant,
  type HairVariant,
  type MouthVariant,
} from "@/utils/avatar";
import { currentSeasonId, previousSeasonId } from "@/utils/ranking";

import {
  SOCIAL_SEED_VERSION,
  type ClassroomContentRecord,
  type ClassroomFolderRecord,
  type SocialDatabase,
  type SocialUserRecord,
} from "./schema";

/**
 * Dados de demonstração de Amigos, Ranking e Turmas.
 *
 * Duas escolhas guiam o conteúdo daqui:
 *  - as datas são relativas a "agora", para a demo nunca parecer congelada;
 *  - o usuário atual entra em três turmas com papéis diferentes (dono, editor
 *    e membro), que é o único jeito de demonstrar as regras de permissão
 *    sem precisar de uma segunda conta.
 */

const HAIRS: HairVariant[] = [
  "shortHair",
  "braids",
  "curlyBob",
  "mohawk",
  "bunHair",
  "wavyBob",
  "froBun",
  "straightHair",
  "bangs",
  "curlyShortHair",
  "bowlCutHair",
  "halfShavedHead",
  "shavedHead",
];

const EYES: EyesVariant[] = ["normal", "cheery", "winking", "starstruck"];

const MOUTHS: MouthVariant[] = [
  "openedSmile",
  "teethSmile",
  "braces",
  "kwaii",
  "gapSmile",
];

/** Avatar estável por índice: o mesmo colega tem sempre a mesma cara. */
function seedAvatar(index: number): string {
  return buildAvatarUrl({
    ...DEFAULT_AVATAR_CONFIG,
    hair: HAIRS[index % HAIRS.length],
    eyes: EYES[index % EYES.length],
    mouth: MOUTHS[index % MOUTHS.length],
    hairColor: defaultHairColors[index % defaultHairColors.length],
    skinColor: defaultSkinColors[index % defaultSkinColors.length],
    backgroundColor:
      defaultBackgroundColors[index % defaultBackgroundColors.length],
  });
}

const DAY_MS = 86_400_000;

function daysAgo(days: number, now: number): string {
  return new Date(now - days * DAY_MS).toISOString();
}

interface SeedPerson {
  username: string;
  displayName: string;
  flashcards: number;
  quizzes: number;
}

/** Colegas fictícios. O XP sai da atividade, não de um número solto. */
const PEOPLE: SeedPerson[] = [
  {
    username: "ana.souza",
    displayName: "Ana Souza",
    flashcards: 214,
    quizzes: 41,
  },
  {
    username: "lucas.ferreira",
    displayName: "Lucas Ferreira",
    flashcards: 186,
    quizzes: 38,
  },
  {
    username: "bia.martins",
    displayName: "Bia Martins",
    flashcards: 173,
    quizzes: 30,
  },
  {
    username: "carla.nunes",
    displayName: "Carla Nunes",
    flashcards: 158,
    quizzes: 27,
  },
  {
    username: "pedro.alves",
    displayName: "Pedro Alves",
    flashcards: 140,
    quizzes: 24,
  },
  {
    username: "julia.ramos",
    displayName: "Júlia Ramos",
    flashcards: 121,
    quizzes: 22,
  },
  {
    username: "rafael.lima",
    displayName: "Rafael Lima",
    flashcards: 104,
    quizzes: 18,
  },
  {
    username: "marina.costa",
    displayName: "Marina Costa",
    flashcards: 92,
    quizzes: 15,
  },
  {
    username: "gabriel.pinto",
    displayName: "Gabriel Pinto",
    flashcards: 78,
    quizzes: 12,
  },
  {
    username: "leticia.barros",
    displayName: "Letícia Barros",
    flashcards: 61,
    quizzes: 10,
  },
  {
    username: "thiago.moura",
    displayName: "Thiago Moura",
    flashcards: 47,
    quizzes: 8,
  },
  {
    username: "sofia.duarte",
    displayName: "Sofia Duarte",
    flashcards: 33,
    quizzes: 6,
  },
  {
    username: "enzo.cardoso",
    displayName: "Enzo Cardoso",
    flashcards: 21,
    quizzes: 4,
  },
  {
    username: "helena.viana",
    displayName: "Helena Viana",
    flashcards: 12,
    quizzes: 1,
  },
];

function id(username: string): string {
  return `u-${username}`;
}

export function createSocialSeed(currentUser: {
  id: string;
  username: string;
}): SocialDatabase {
  const now = Date.now();
  const seasonId = currentSeasonId(new Date(now));
  const lastSeason = previousSeasonId(seasonId);

  const me: SocialUserRecord = {
    id: currentUser.id,
    username: currentUser.username,
    displayName: currentUser.username,
    // Deixado nulo de propósito: a tela cai nas iniciais, e quem editou o
    // avatar no perfil não vê aqui um boneco diferente do seu.
    avatarUrl: null,
    flashcards: 116,
    quizzes: 19,
  };

  const others: SocialUserRecord[] = PEOPLE.map((person, index) => ({
    id: id(person.username),
    username: person.username,
    displayName: person.displayName,
    avatarUrl: seedAvatar(index),
    flashcards: person.flashcards,
    quizzes: person.quizzes,
  }));

  const folders: ClassroomFolderRecord[] = [
    // Turma da qual o usuário é dono.
    {
      id: "cf-1",
      classroomId: "c-1",
      name: "Funções",
      color: "#0000EE",
      createdAt: daysAgo(28, now),
    },
    {
      id: "cf-2",
      classroomId: "c-1",
      name: "Trigonometria",
      color: "#22c55e",
      createdAt: daysAgo(21, now),
    },
    {
      id: "cf-3",
      classroomId: "c-1",
      name: "Provas antigas",
      color: "#f97316",
      createdAt: daysAgo(9, now),
    },
    // Turma da qual o usuário é editor.
    {
      id: "cf-4",
      classroomId: "c-2",
      name: "Mecânica",
      color: "#8b5cf6",
      createdAt: daysAgo(44, now),
    },
    {
      id: "cf-5",
      classroomId: "c-2",
      name: "Eletricidade",
      color: "#06b6d4",
      createdAt: daysAgo(31, now),
    },
    // Turma da qual o usuário é membro.
    {
      id: "cf-6",
      classroomId: "c-3",
      name: "Repertório sociocultural",
      color: "#ec4899",
      createdAt: daysAgo(52, now),
    },
    {
      id: "cf-7",
      classroomId: "c-3",
      name: "Redações corrigidas",
      color: "#eab308",
      createdAt: daysAgo(17, now),
    },
    // Turma do convite pendente — o usuário ainda não vê estas pastas.
    {
      id: "cf-8",
      classroomId: "c-4",
      name: "Citologia",
      color: "#22c55e",
      createdAt: daysAgo(13, now),
    },
  ];

  const contents: ClassroomContentRecord[] = [
    // c-1 — o usuário é dono e autor de parte do conteúdo.
    {
      id: "cc-1",
      classroomId: "c-1",
      folderId: "cf-1",
      kind: "summary",
      title: "Função do 1º grau: resumo",
      description: "Coeficiente angular, linear e a leitura do gráfico.",
      authorId: me.id,
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(27, now),
      updatedAt: daysAgo(27, now),
    },
    {
      id: "cc-2",
      classroomId: "c-1",
      folderId: "cf-1",
      kind: "flashcards",
      title: "Função quadrática — 18 cartões",
      description: "Vértice, raízes e concavidade.",
      authorId: me.id,
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(24, now),
      updatedAt: daysAgo(24, now),
    },
    {
      id: "cc-3",
      classroomId: "c-1",
      folderId: "cf-1",
      kind: "pdf",
      title: "Lista de exercícios 04",
      description: "Enviada pela Ana depois da aula de segunda.",
      authorId: id("ana.souza"),
      fileName: "lista-04-funcoes.pdf",
      fileSize: 1_284_301,
      createdAt: daysAgo(20, now),
      updatedAt: daysAgo(20, now),
    },
    {
      id: "cc-4",
      classroomId: "c-1",
      folderId: "cf-2",
      kind: "quiz",
      title: "Simulado de trigonometria",
      description: "12 questões no estilo ENEM.",
      authorId: id("pedro.alves"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(15, now),
      updatedAt: daysAgo(15, now),
    },
    {
      id: "cc-5",
      classroomId: "c-1",
      folderId: "cf-2",
      kind: "image",
      title: "Ciclo trigonométrico (quadro)",
      description: "Foto do quadro da aula de quinta.",
      authorId: id("ana.souza"),
      fileName: "ciclo-trigonometrico.jpg",
      fileSize: 842_110,
      createdAt: daysAgo(11, now),
      updatedAt: daysAgo(11, now),
    },
    {
      id: "cc-6",
      classroomId: "c-1",
      folderId: "cf-3",
      kind: "pdf",
      title: "Prova bimestral de 2025",
      description: "Com gabarito na última página.",
      authorId: me.id,
      fileName: "prova-bimestral-2025.pdf",
      fileSize: 2_015_776,
      createdAt: daysAgo(8, now),
      updatedAt: daysAgo(8, now),
    },

    // c-2 — o usuário é editor: só pode mexer no que é dele.
    {
      id: "cc-7",
      classroomId: "c-2",
      folderId: "cf-4",
      kind: "summary",
      title: "Leis de Newton: resumo",
      description: "As três leis com exemplos do cotidiano.",
      authorId: id("lucas.ferreira"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(40, now),
      updatedAt: daysAgo(38, now),
    },
    {
      id: "cc-8",
      classroomId: "c-2",
      folderId: "cf-4",
      kind: "flashcards",
      title: "Cinemática — 24 cartões",
      description: "MRU, MRUV e queda livre.",
      authorId: me.id,
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(19, now),
      updatedAt: daysAgo(19, now),
    },
    {
      id: "cc-9",
      classroomId: "c-2",
      folderId: "cf-4",
      kind: "quiz",
      title: "Simulado de dinâmica",
      description: "10 questões com plano inclinado.",
      authorId: id("julia.ramos"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(12, now),
      updatedAt: daysAgo(12, now),
    },
    {
      id: "cc-10",
      classroomId: "c-2",
      folderId: "cf-5",
      kind: "pdf",
      title: "Circuitos em série e paralelo",
      description: "Apostila que o professor passou.",
      authorId: id("lucas.ferreira"),
      fileName: "circuitos.pdf",
      fileSize: 3_402_889,
      createdAt: daysAgo(7, now),
      updatedAt: daysAgo(7, now),
    },

    // c-3 — o usuário é membro: nada de escrita.
    {
      id: "cc-11",
      classroomId: "c-3",
      folderId: "cf-6",
      kind: "summary",
      title: "Repertórios sobre meio ambiente",
      description: "Dados, autores e citações prontas para usar.",
      authorId: id("bia.martins"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(50, now),
      updatedAt: daysAgo(45, now),
    },
    {
      id: "cc-12",
      classroomId: "c-3",
      folderId: "cf-6",
      kind: "flashcards",
      title: "Conectivos argumentativos",
      description: "30 cartões de coesão textual.",
      authorId: id("marina.costa"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(33, now),
      updatedAt: daysAgo(33, now),
    },
    {
      id: "cc-13",
      classroomId: "c-3",
      folderId: "cf-7",
      kind: "image",
      title: "Redação nota 980 comentada",
      description: "Correção da professora em vermelho.",
      authorId: id("bia.martins"),
      fileName: "redacao-980.png",
      fileSize: 1_620_444,
      createdAt: daysAgo(16, now),
      updatedAt: daysAgo(16, now),
    },

    // c-4 — turma do convite pendente.
    {
      id: "cc-14",
      classroomId: "c-4",
      folderId: "cf-8",
      kind: "summary",
      title: "Organelas celulares",
      description: "Função de cada organela em tabela.",
      authorId: id("carla.nunes"),
      fileName: null,
      fileSize: null,
      createdAt: daysAgo(12, now),
      updatedAt: daysAgo(12, now),
    },
  ];

  return {
    version: SOCIAL_SEED_VERSION,
    ownerUserId: me.id,
    seasonId,
    users: [me, ...others],

    friendships: [
      {
        id: "fs-1",
        userIdA: me.id,
        userIdB: id("ana.souza"),
        createdAt: daysAgo(64, now),
      },
      {
        id: "fs-2",
        userIdA: me.id,
        userIdB: id("lucas.ferreira"),
        createdAt: daysAgo(41, now),
      },
      {
        id: "fs-3",
        userIdA: me.id,
        userIdB: id("julia.ramos"),
        createdAt: daysAgo(23, now),
      },
      {
        id: "fs-4",
        userIdA: me.id,
        userIdB: id("marina.costa"),
        createdAt: daysAgo(6, now),
      },
      // Amizade entre terceiros: o ranking de amigos não é o mesmo para todos.
      {
        id: "fs-5",
        userIdA: id("ana.souza"),
        userIdB: id("bia.martins"),
        createdAt: daysAgo(70, now),
      },
    ],

    friendRequests: [
      {
        id: "fr-1",
        fromId: id("bia.martins"),
        toId: me.id,
        status: "pending",
        createdAt: daysAgo(3, now),
      },
      {
        id: "fr-2",
        fromId: id("rafael.lima"),
        toId: me.id,
        status: "pending",
        createdAt: daysAgo(1, now),
      },
      {
        id: "fr-3",
        fromId: me.id,
        toId: id("pedro.alves"),
        status: "pending",
        createdAt: daysAgo(2, now),
      },
    ],

    classrooms: [
      {
        id: "c-1",
        name: "3-B Matemática",
        description:
          "Turma da manhã, prof. Rejane. Tudo de função e trigonometria.",
        color: "#0000EE",
        ownerId: me.id,
        createdAt: daysAgo(30, now),
      },
      {
        id: "c-2",
        name: "Física — ENEM 2026",
        description: "Grupo de estudos para a prova de ciências da natureza.",
        color: "#8b5cf6",
        ownerId: id("lucas.ferreira"),
        createdAt: daysAgo(46, now),
      },
      {
        id: "c-3",
        name: "Redação Nota 1000",
        description: "Repertórios, modelos e correções comentadas.",
        color: "#ec4899",
        ownerId: id("bia.martins"),
        createdAt: daysAgo(54, now),
      },
      {
        id: "c-4",
        name: "Biologia — Citologia",
        description: "Monitoria de biologia das terças.",
        color: "#22c55e",
        ownerId: id("carla.nunes"),
        createdAt: daysAgo(14, now),
      },
    ],

    members: [
      {
        id: "cm-1",
        classroomId: "c-1",
        userId: me.id,
        role: "owner",
        joinedAt: daysAgo(30, now),
      },
      {
        id: "cm-2",
        classroomId: "c-1",
        userId: id("ana.souza"),
        role: "editor",
        joinedAt: daysAgo(29, now),
      },
      {
        id: "cm-3",
        classroomId: "c-1",
        userId: id("pedro.alves"),
        role: "editor",
        joinedAt: daysAgo(26, now),
      },
      {
        id: "cm-4",
        classroomId: "c-1",
        userId: id("sofia.duarte"),
        role: "viewer",
        joinedAt: daysAgo(18, now),
      },
      {
        id: "cm-5",
        classroomId: "c-1",
        userId: id("enzo.cardoso"),
        role: "viewer",
        joinedAt: daysAgo(10, now),
      },

      {
        id: "cm-6",
        classroomId: "c-2",
        userId: id("lucas.ferreira"),
        role: "owner",
        joinedAt: daysAgo(46, now),
      },
      {
        id: "cm-7",
        classroomId: "c-2",
        userId: me.id,
        role: "editor",
        joinedAt: daysAgo(35, now),
      },
      {
        id: "cm-8",
        classroomId: "c-2",
        userId: id("julia.ramos"),
        role: "editor",
        joinedAt: daysAgo(34, now),
      },
      {
        id: "cm-9",
        classroomId: "c-2",
        userId: id("thiago.moura"),
        role: "viewer",
        joinedAt: daysAgo(20, now),
      },

      {
        id: "cm-10",
        classroomId: "c-3",
        userId: id("bia.martins"),
        role: "owner",
        joinedAt: daysAgo(54, now),
      },
      {
        id: "cm-11",
        classroomId: "c-3",
        userId: me.id,
        role: "viewer",
        joinedAt: daysAgo(37, now),
      },
      {
        id: "cm-12",
        classroomId: "c-3",
        userId: id("marina.costa"),
        role: "editor",
        joinedAt: daysAgo(50, now),
      },
      {
        id: "cm-13",
        classroomId: "c-3",
        userId: id("leticia.barros"),
        role: "viewer",
        joinedAt: daysAgo(28, now),
      },

      {
        id: "cm-14",
        classroomId: "c-4",
        userId: id("carla.nunes"),
        role: "owner",
        joinedAt: daysAgo(14, now),
      },
      {
        id: "cm-15",
        classroomId: "c-4",
        userId: id("gabriel.pinto"),
        role: "editor",
        joinedAt: daysAgo(13, now),
      },
    ],

    folders,
    contents,

    invites: [
      // Convite nominal pendente para o usuário atual.
      {
        id: "ci-1",
        classroomId: "c-4",
        code: "BIOCEL24",
        role: "viewer",
        status: "pending",
        invitedById: id("carla.nunes"),
        inviteeId: me.id,
        createdAt: daysAgo(2, now),
        expiresAt: null,
      },
      // Link ativo da turma do usuário, para demonstrar o compartilhamento.
      {
        id: "ci-2",
        classroomId: "c-1",
        code: "MAT3B2026",
        role: "editor",
        status: "pending",
        invitedById: me.id,
        inviteeId: null,
        createdAt: daysAgo(5, now),
        expiresAt: null,
      },
      // Convite nominal já enviado pelo usuário, esperando resposta.
      {
        id: "ci-3",
        classroomId: "c-1",
        code: "MAT3BHEL",
        role: "viewer",
        status: "pending",
        invitedById: me.id,
        inviteeId: id("helena.viana"),
        createdAt: daysAgo(4, now),
        expiresAt: null,
      },
    ],

    champions: [
      {
        seasonId: lastSeason,
        scope: "global",
        classroomId: null,
        userId: id("ana.souza"),
        xp: 3_180,
      },
      {
        seasonId: lastSeason,
        scope: "friends",
        classroomId: null,
        userId: id("lucas.ferreira"),
        xp: 2_640,
      },
      {
        seasonId: lastSeason,
        scope: "classroom",
        classroomId: "c-1",
        userId: id("pedro.alves"),
        xp: 1_920,
      },
      {
        seasonId: lastSeason,
        scope: "classroom",
        classroomId: "c-2",
        userId: id("julia.ramos"),
        xp: 2_070,
      },
      {
        seasonId: lastSeason,
        scope: "classroom",
        classroomId: "c-3",
        userId: id("marina.costa"),
        xp: 1_450,
      },
      {
        seasonId: lastSeason,
        scope: "classroom",
        classroomId: "c-4",
        userId: id("carla.nunes"),
        xp: 980,
      },
    ],

    reviMaterials: [
      {
        id: "rm-1",
        kind: "flashcards",
        title: "Progressão aritmética — 16 cartões",
        description: "Gerado a partir da foto do caderno.",
      },
      {
        id: "rm-2",
        kind: "summary",
        title: "Logaritmos: propriedades",
        description: "Resumo gerado do capítulo 7.",
      },
      {
        id: "rm-3",
        kind: "quiz",
        title: "Simulado de geometria plana",
        description: "15 questões geradas das suas anotações.",
      },
      {
        id: "rm-4",
        kind: "flashcards",
        title: "Termodinâmica — 22 cartões",
        description: "Gerado da lista de física da semana.",
      },
      {
        id: "rm-5",
        kind: "summary",
        title: "Revolução Industrial",
        description: "Resumo gerado da foto da apostila.",
      },
      {
        id: "rm-6",
        kind: "quiz",
        title: "Simulado de interpretação de texto",
        description: "10 questões geradas das suas redações.",
      },
    ],
  };
}
