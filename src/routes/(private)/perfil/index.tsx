import { Avatar, Button } from "@heroui/react";
import { Flame, LogOut, Mail, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { resendVerificationEmail } from "@/api/auth";
import { getStreak } from "@/api/streak";
import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/utils/text";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [streak, setStreak] = useState<{
    currentStreak: number;
    recordStreak: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getStreak()
      .then((result) => {
        if (!cancelled) setStreak(result);
      })
      .catch(() => {
        // Estatísticas secundárias nesta tela — uma falha aqui não deve
        // travar o resto do perfil.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [verificationState, setVerificationState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    navigate("/", { replace: true });
  }

  async function handleResendVerification() {
    setVerificationState("sending");

    try {
      await resendVerificationEmail();
      setVerificationState("sent");
    } catch {
      setVerificationState("error");
    }
  }

  if (user === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <NavMenu title="Perfil" />

      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-surface sm:flex-row sm:items-center sm:gap-6">
        <Avatar size="lg" variant="soft" color="accent" className="shrink-0">
          <Avatar.Fallback>{getInitials(user.username)}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold break-words">
            {user.username}
          </h2>
          <p className="text-muted text-sm break-all">{user.email}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatTile
          label="Dias em ascensão"
          value={streak !== null ? `${streak.currentStreak}` : "–"}
          hint="Sua sequência atual"
          icon={Flame}
        />
        <StatTile
          label="Recorde"
          value={streak !== null ? `${streak.recordStreak} dias` : "–"}
          hint="Sua maior sequência"
          icon={Trophy}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          className="w-full sm:w-fit"
          isDisabled={verificationState === "sending"}
          onPress={handleResendVerification}
        >
          <Mail className="size-4" />
          {verificationState === "sent"
            ? "E-mail de verificação reenviado"
            : "Reenviar e-mail de verificação"}
        </Button>

        <Button
          variant="secondary"
          className="w-full sm:w-fit"
          isDisabled={isSigningOut}
          onPress={handleSignOut}
        >
          <LogOut className="size-4" />
          Sair da conta
        </Button>
      </div>

      {verificationState === "error" ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          Não foi possível reenviar o e-mail de verificação. Tente novamente.
        </p>
      ) : null}
    </main>
  );
}
