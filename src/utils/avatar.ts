export const avatarCharacteristics = {
  accessories: {
    sunglasses: "Óculos escuros",
    catEars: "Orelhas de gato",
    clownNose: "Nariz de palhaço",
    faceMask: "Máscara de rosto",
    glasses: "Óculos",
    mustache: "Bigode",
    sailormoonCrown: "Coroa da Sailor Moon",
    sleepMask: "Máscara de sono",
  },
  eyes: {
    angry: "Bravo",
    cheery: "Alegre",
    confused: "Confuso",
    normal: "Normal",
    sad: "Triste",
    sleepy: "Dormindo",
    starstruck: "Estrelado",
    winking: "Piscando",
  },
  hair: {
    bangs: "Franja",
    bowlCutHair: "Corte tigela",
    braids: "Tranças",
    bunHair: "Coque",
    curlyBob: "Bob cacheado",
    curlyShortHair: "Cabelo curto cacheado",
    froBun: "Coque afro",
    halfShavedHead: "Lateral raspada",
    mohawk: "Moicano",
    shavedHead: "Cabeça raspada",
    shortHair: "Cabelo curto",
    straightHair: "Cabelo liso",
    wavyBob: "Bob ondulado",
  },
  mouth: {
    awkwardSmile: "Sem graça",
    braces: "Aparelho",
    gapSmile: "Dentes separados",
    kwaii: "Fofo",
    openedSmile: "Sorridente",
    openSad: "Triste",
    teethSmile: "Sorriso com dentes",
    unimpressed: "Indiferente",
  },
};

export const defaultBackgroundColors = [
  "ff5d8f",
  "ffb703",
  "43aa8b",
  "4d96ff",
  "b57bff",
];

export const defaultHairColors = [
  "220f00",
  "3a1a00",
  "71472d",
  "e2ba87",
  "605de4",
  "238d80",
  "d56c0c",
  "e9b729",
];

export const defaultSkinColors = [
  "ffe4c0",
  "f5d7b1",
  "efcc9f",
  "e2ba87",
  "c99c62",
  "a47539",
  "8c5a2b",
  "643d19",
];

export type AvatarGroup = keyof typeof avatarCharacteristics;

export type AccessoriesVariant = keyof typeof avatarCharacteristics.accessories;
export type EyesVariant = keyof typeof avatarCharacteristics.eyes;
export type HairVariant = keyof typeof avatarCharacteristics.hair;
export type MouthVariant = keyof typeof avatarCharacteristics.mouth;

export interface AvatarConfig {
  /** `null` é a escolha "Sem acessório", e vira `accessoriesProbability=0`. */
  accessories: AccessoriesVariant | null;
  eyes: EyesVariant;
  hair: HairVariant;
  mouth: MouthVariant;
  /** Hex de seis dígitos sem `#`: é o formato que o DiceBear aceita na query. */
  hairColor: string;
  skinColor: string;
  backgroundColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  accessories: null,
  eyes: "normal",
  hair: "shortHair",
  mouth: "openedSmile",
  hairColor: defaultHairColors[0],
  skinColor: defaultSkinColors[0],
  backgroundColor: defaultBackgroundColors[0],
};

const AVATAR_ENDPOINT = "https://api.dicebear.com/10.x/big-smile/svg";

/** Miniatura local da peça, servida de `public/avatar/`. */
export function avatarPreviewSrc(group: AvatarGroup, variant: string) {
  return `/avatar/${group}/${variant}.svg`;
}

/**
 * A URL é a representação canônica do avatar — é ela que vai e volta do backend.
 * A ordem dos parâmetros é fixa de propósito: assim a mesma configuração sempre
 * produz a mesma string, e dá para saber se houve mudança comparando as duas.
 *
 * Não há `seed`: com todas as variants fixadas, ele só altera o sufixo dos `id`
 * internos do SVG, e o desenho sai idêntico.
 */
export function buildAvatarUrl(config: AvatarConfig): string {
  const params = new URLSearchParams();

  if (config.accessories !== null) {
    params.set("accessoriesVariant", config.accessories);
    params.set("accessoriesProbability", "100");
  } else {
    params.set("accessoriesProbability", "0");
  }

  params.set("eyesVariant", config.eyes);
  params.set("eyesProbability", "100");
  params.set("hairVariant", config.hair);
  params.set("hairProbability", "100");
  params.set("mouthVariant", config.mouth);
  params.set("mouthProbability", "100");
  params.set("hairColor", config.hairColor);
  params.set("skinColor", config.skinColor);
  params.set("backgroundColor", config.backgroundColor);

  return `${AVATAR_ENDPOINT}?${params.toString()}`;
}

// `Object.hasOwn`, e não `in`: `"toString" in avatarCharacteristics.hair` é
// verdadeiro, e passaria por uma variant válida.
function isVariantOf(group: AvatarGroup, value: unknown) {
  return typeof value === "string" && Object.hasOwn(avatarCharacteristics[group], value);
}

const HEX_PATTERN = /^[0-9a-f]{6}$/i;

function sanitizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;

  // Tolera `#RRGGBB` caso o backend passe a devolver a cor com cerquilha.
  const hex = value.replace(/^#/, "").toLowerCase();

  return HEX_PATTERN.test(hex) ? hex : fallback;
}

/**
 * Cada campo é validado isoladamente e cai no default quando não reconhecido —
 * uma propriedade corrompida não pode embaralhar as outras seis.
 */
export function sanitizeAvatarConfig(value: unknown): AvatarConfig {
  const raw = (value ?? {}) as Partial<Record<keyof AvatarConfig, unknown>>;

  return {
    // `null` explícito é "Sem acessório"; `undefined` é ausência de informação.
    accessories:
      raw.accessories === null
        ? null
        : isVariantOf("accessories", raw.accessories)
          ? (raw.accessories as AccessoriesVariant)
          : DEFAULT_AVATAR_CONFIG.accessories,
    eyes: isVariantOf("eyes", raw.eyes)
      ? (raw.eyes as EyesVariant)
      : DEFAULT_AVATAR_CONFIG.eyes,
    hair: isVariantOf("hair", raw.hair)
      ? (raw.hair as HairVariant)
      : DEFAULT_AVATAR_CONFIG.hair,
    mouth: isVariantOf("mouth", raw.mouth)
      ? (raw.mouth as MouthVariant)
      : DEFAULT_AVATAR_CONFIG.mouth,
    hairColor: sanitizeHex(raw.hairColor, DEFAULT_AVATAR_CONFIG.hairColor),
    skinColor: sanitizeHex(raw.skinColor, DEFAULT_AVATAR_CONFIG.skinColor),
    backgroundColor: sanitizeHex(
      raw.backgroundColor,
      DEFAULT_AVATAR_CONFIG.backgroundColor,
    ),
  };
}

/**
 * O caminho de volta: o backend guarda só a string, então a tela de edição
 * precisa reabrir com as peças do avatar atual já marcadas.
 */
export function parseAvatarUrl(url: string): AvatarConfig | null {
  let params: URLSearchParams;

  try {
    const parsed = new URL(url);

    if (!parsed.pathname.includes("big-smile")) return null;

    params = parsed.searchParams;
  } catch {
    return null;
  }

  // O default de primeiro acesso do backend é `?seed=<ownerId>` — sem nenhum
  // desses parâmetros, o DiceBear sorteia o desenho inteiro a partir do hash
  // do seed, e não há como recuperar quais variants ele escolheu. Tratar como
  // "sem config" (em vez de cair no default fixo abaixo) evita que o editor
  // abra sempre com a mesma cara pra todo mundo, diferente do avatar salvo.
  const hasEditorParams =
    params.has("eyesVariant") ||
    params.has("hairVariant") ||
    params.has("mouthVariant") ||
    params.has("accessoriesProbability");

  if (!hasEditorParams) return null;

  const hasAccessories = params.get("accessoriesProbability") !== "0";

  return sanitizeAvatarConfig({
    // `?? undefined` para o parâmetro ausente não ser lido como "Sem acessório".
    accessories: hasAccessories
      ? (params.get("accessoriesVariant") ?? undefined)
      : null,
    eyes: params.get("eyesVariant"),
    hair: params.get("hairVariant"),
    mouth: params.get("mouthVariant"),
    hairColor: params.get("hairColor"),
    skinColor: params.get("skinColor"),
    backgroundColor: params.get("backgroundColor"),
  });
}

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * Primeiro acesso e botão "Surpreenda-me". Só pode ser chamada depois da
 * montagem: o app é renderizado no servidor, e sortear durante o render faria o
 * HTML do servidor divergir do da hidratação.
 *
 * O `null` entra no sorteio de acessórios de propósito — nem todo avatar novo
 * deve nascer com nariz de palhaço.
 */
export function randomAvatarConfig(): AvatarConfig {
  const accessories = Object.keys(
    avatarCharacteristics.accessories,
  ) as AccessoriesVariant[];

  return {
    accessories: pickRandom([...accessories, null]),
    eyes: pickRandom(Object.keys(avatarCharacteristics.eyes) as EyesVariant[]),
    hair: pickRandom(Object.keys(avatarCharacteristics.hair) as HairVariant[]),
    mouth: pickRandom(
      Object.keys(avatarCharacteristics.mouth) as MouthVariant[],
    ),
    hairColor: pickRandom(defaultHairColors),
    skinColor: pickRandom(defaultSkinColors),
    backgroundColor: pickRandom(defaultBackgroundColors),
  };
}
