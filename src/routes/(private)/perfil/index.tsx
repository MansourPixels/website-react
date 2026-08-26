import { Avatar, Button } from "@heroui/react";
import { Flame, LogOut, Trophy } from "lucide-react";
import { useNavigate } from "react-router";

import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { useAuth } from "@/contexts/AuthContext";
import { ascension } from "@/mocks/ascension";
import { getInitials } from "@/utils/text";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { currentStreak, recordStreak } = ascension;

  function handleSignOut() {
    signOut();
    navigate("/", { replace: true });
  }

  if (user === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Perfil" />

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-surface sm:flex-row sm:items-center sm:gap-6">
        <Avatar size="lg" variant="soft" color="accent" className="shrink-0">
          <Avatar.Fallback>{getInitials(user.name)}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold break-words">{user.name}</h2>
          <p className="text-muted text-sm break-all">{user.email}</p>
          <p className="text-muted text-sm">Conta local neste dispositivo</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatTile
          label="Dias em ascensão"
          value={`${currentStreak}`}
          hint="Sua sequência atual"
          icon={Flame}
        />
        <StatTile
          label="Recorde"
          value={`${recordStreak} dias`}
          hint="Sua maior sequência"
          icon={Trophy}
        />
      </section>

      <Button
        variant="secondary"
        className="w-full sm:w-fit"
        onPress={handleSignOut}
      >
        <LogOut className="size-4" />
        Sair da conta
      </Button>
    </main>
  );
}
