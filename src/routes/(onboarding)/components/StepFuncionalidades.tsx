import {
  CalendarCheck,
  CalendarClock,
  Camera,
  FileText,
  Folders,
  ListCheck,
  Network,
  Route as PathIcon,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

// As seis abas, na ordem em que aparecem na barra inferior (`root.tsx`). A copy
// sai do que já está escrito e revisado nos atalhos do Perfil e na landing —
// nada inventado, nenhum número de eficácia.
const tabs: Feature[] = [
  {
    icon: Camera,
    title: "Capturar",
    body: "A porta de entrada: fotografe o material e o Revi IA arquiva sozinho.",
  },
  {
    icon: Folders,
    title: "Pastas",
    body: "Suas disciplinas e assuntos, com todo o material que você capturou.",
  },
  {
    icon: Timer,
    title: "Sessão",
    body: "Cronômetro de foco e pausa, com a sua música tocando junto.",
  },
  {
    icon: PathIcon,
    title: "Trilha",
    body: "Seu desempenho por disciplina e planos de estudo para os pontos fracos.",
  },
  {
    icon: Users,
    title: "Turmas",
    body: "Material compartilhado com a turma, por convite.",
  },
  {
    icon: Trophy,
    title: "Ranking",
    body: "Seu XP no geral, entre amigos e por turma.",
  },
];

const studyModes: Feature[] = [
  { icon: Zap, title: "Flash cards", body: "Repetição espaçada, no seu ritmo." },
  { icon: FileText, title: "Resumo", body: "O essencial do material, em texto." },
  { icon: ListCheck, title: "Simulado", body: "Alternativas e resultado." },
  { icon: Network, title: "Mapa mental", body: "As ligações entre os conceitos." },
];

const extras: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Ascensão",
    body: "Calendário, marcos e congelamentos da sua sequência.",
  },
  {
    icon: CalendarClock,
    title: "Tarefas",
    body: "Provas e trabalhos com data e hora de entrega.",
  },
];

function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map(({ icon: Icon, title, body }) => (
        <li
          key={title}
          className="flex items-start gap-3 rounded-lg bg-background p-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>

          <div className="flex min-w-0 flex-col">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted text-xs text-pretty">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StepFuncionalidades() {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">
          O que dá para fazer aqui
        </h1>
        <p className="text-muted text-sm text-pretty">
          Um mapa rápido. Você não precisa decorar nada agora.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">As seis abas</h2>
        <FeatureGrid items={tabs} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">
          Quatro jeitos de estudar a mesma foto
        </h2>
        <FeatureGrid items={studyModes} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">E ainda</h2>
        <FeatureGrid items={extras} />
      </section>
    </>
  );
}
