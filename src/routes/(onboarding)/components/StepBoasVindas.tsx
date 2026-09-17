import { Camera, GraduationCap, Sparkles, type LucideIcon } from "lucide-react";

interface Highlight {
  icon: LucideIcon;
  title: string;
  body: string;
}

// A mesma promessa da landing (`(landing)/components/HowItWorks.tsx`), na
// versão curta: quem chegou aqui já se cadastrou e não precisa ser convencido
// de novo, só situado.
const highlights: Highlight[] = [
  {
    icon: Camera,
    title: "Fotografe",
    body: "Caderno, lousa, apostila ou PDF de exercícios.",
  },
  {
    icon: Sparkles,
    title: "O Revi IA arquiva",
    body: "Ele sugere a disciplina e o assunto. Se errar, você corrige.",
  },
  {
    icon: GraduationCap,
    title: "Estude",
    body: "O material vira flash cards, resumo, simulado e mapa mental.",
  },
];

export function StepBoasVindas({ username }: { username: string }) {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-balance">
          Boas-vindas, {username}
        </h1>
        <p className="text-muted text-sm text-pretty">
          São três passos rápidos até a sua primeira foto. Dá para pular
          qualquer um deles.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {highlights.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>

            <div className="flex min-w-0 flex-col">
              <h2 className="font-semibold">{title}</h2>
              <p className="text-muted text-sm text-pretty">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
