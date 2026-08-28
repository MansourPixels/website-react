import { getInitials } from "@/utils/text";
import { Avatar } from "@heroui/react";

interface TeamMember {
  name: string;
  user: string;
}

const members: TeamMember[] = [
  { name: "Allex Brandão", user: "Allexbrandao07" },
  { name: "Enzo Abreu", user: "Abreu-Enzo" },
  { name: "Erick Nathan", user: "ericknathan" },
  { name: "Henrique Bueno", user: "Henrique-CBueno" },
  { name: "Murilo Gomes", user: "Murilo-Vasconcelos" },
];

export function Team() {
  return (
    <section
      id="equipe"
      className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-8 pb-16 md:px-8 lg:py-12 lg:pb-24"
    >
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Nossa equipe.
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-muted">
          Os cinco integrantes por trás do Revi.
        </p>
      </header>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {members.map(({ name, user }) => (
          <li key={user} className="reveal">
            <a
              href={`https://github.com/${user}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-full flex-col items-center gap-4 rounded-3xl bg-white p-5 text-center shadow-surface outline-accent transition focus-visible:outline-2 motion-safe:hover:-translate-y-0.5 md:p-6"
            >
              <Avatar className="size-20 rounded-full">
                <Avatar.Image src={`https://github.com/${user}.png`} alt="" />
                <Avatar.Fallback className="text-lg">
                  {getInitials(name)}
                </Avatar.Fallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-muted">@{user}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
