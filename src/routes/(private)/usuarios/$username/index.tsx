import { Avatar, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ClipboardList, Layers, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { ApiError } from "@/api/client";
import { getPublicProfile } from "@/api/profile";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { NavMenu } from "@/components/NavMenu";
import { StatTile } from "@/components/StatTile";
import { UserIdentity } from "@/components/UserIdentity";
import type { PublicProfile } from "@/types/api/profile";
import { formatPosition, formatXp } from "@/utils/ranking";
import { getInitials } from "@/utils/text";

import { FriendshipAction } from "./components/FriendshipAction";

export default function PublicProfilePage() {
  const { username } = useParams();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (username === undefined) return;

    let cancelled = false;

    setProfile(null);
    setLoadError(null);

    getPublicProfile(username)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof ApiError
            ? error.detail
            : "Não foi possível carregar este perfil. Tente novamente.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  function handleFriendshipChange(
    friendship: PublicProfile["friendship"],
    pendingRequestId: string | null,
  ) {
    setProfile((current) =>
      current === null
        ? null
        : {
            ...current,
            friendship,
            pendingRequestId,
            // Virar amigo (ou deixar de ser) muda o total na hora; recarregar o
            // perfil só por causa de um número seria desproporcional.
            friendCount:
              friendship === "friends" && current.friendship !== "friends"
                ? current.friendCount + 1
                : friendship !== "friends" && current.friendship === "friends"
                  ? Math.max(0, current.friendCount - 1)
                  : current.friendCount,
          },
    );
  }

  if (loadError !== null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu title="Perfil" hasBackButton />
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)}>
          {loadError}
        </ErrorState>
      </main>
    );
  }

  if (profile === null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
        <NavMenu title="Perfil" hasBackButton />
        <div
          className="flex flex-1 items-center justify-center p-6"
          aria-busy="true"
        >
          <Spinner size="lg" />
          <span className="sr-only">Carregando o perfil</span>
        </div>
      </main>
    );
  }

  const { user } = profile;
  const displayName = user.displayName || user.username;
  const sharedClassrooms = profile.sharedClassrooms ?? [];
  const hasNothingInCommon =
    profile.friendship !== "self" &&
    profile.mutualFriends.length === 0 &&
    sharedClassrooms.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-8">
      <NavMenu title={displayName} hasBackButton />

      <section className="bg-surface shadow-surface flex flex-col items-center gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:gap-6">
        <Avatar
          size="lg"
          variant="soft"
          color="accent"
          className="size-26 shrink-0 rounded-2xl"
        >
          <Avatar.Image src={user.avatarUrl} alt="" />
          <Avatar.Fallback>{getInitials(displayName)}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
          <h2 className="text-xl font-semibold break-words">{displayName}</h2>
          <p className="text-muted text-sm break-all">@{user.username}</p>
          <p className="text-muted text-xs tabular-nums">
            {profile.friendCount}{" "}
            {profile.friendCount === 1 ? "amigo" : "amigos"} no Revi
          </p>
        </div>

        <div className="sm:ml-auto">
          <FriendshipAction
            profile={profile}
            onChange={handleFriendshipChange}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="XP na temporada"
          value={formatXp(user.xp)}
          hint="Zera todo mês"
          icon={Sparkles}
        />
        {profile.globalPosition !== undefined &&
        profile.globalTotal !== undefined ? (
          <StatTile
            label="Posição global"
            value={formatPosition(profile.globalPosition)}
            hint={
              profile.globalPosition === null
                ? "Ainda não pontuou"
                : `de ${profile.globalTotal} ${
                    profile.globalTotal === 1 ? "pessoa" : "pessoas"
                  }`
            }
            icon={Trophy}
          />
        ) : null}
        {profile.flashcards !== undefined ? (
          <StatTile
            label="Flash cards"
            value={profile.flashcards.toLocaleString("pt-BR")}
            hint="Cartões respondidos"
            icon={Layers}
          />
        ) : null}
        {profile.quizzes !== undefined ? (
          <StatTile
            label="Simulados"
            value={profile.quizzes.toLocaleString("pt-BR")}
            hint="Provas concluídas"
            icon={ClipboardList}
          />
        ) : null}
      </section>

      {sharedClassrooms.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="font-semibold">Turmas em comum</h2>
            <p className="text-muted text-xs text-balance">
              Turmas em que vocês dois estão.
            </p>
          </header>
          <ul className="flex flex-col gap-2">
            {sharedClassrooms.map((classroom) => (
              <li key={classroom.id}>
                <Link
                  to={`/turmas/${classroom.id}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className:
                      "bg-surface shadow-surface flex h-auto w-full items-center gap-3 rounded-xl p-3",
                  })}
                >
                  <span
                    aria-hidden="true"
                    className="size-9 shrink-0 rounded-xl"
                    style={{ backgroundColor: classroom.color }}
                  />
                  <span className="flex-1 truncate text-left font-medium">
                    {classroom.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.mutualFriends.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="font-semibold">Amigos em comum</h2>
            <p className="text-muted text-xs text-balance">
              <span className="tabular-nums">
                {profile.mutualFriends.length}
              </span>{" "}
              {profile.mutualFriends.length === 1
                ? "pessoa que vocês dois conhecem"
                : "pessoas que vocês dois conhecem"}
              .
            </p>
          </header>
          <ul className="flex flex-col gap-2">
            {profile.mutualFriends.map((friend) => (
              <li
                key={friend.id}
                className="bg-surface shadow-surface flex items-center gap-3 rounded-xl p-3"
              >
                <UserIdentity
                  user={friend}
                  size="sm"
                  linkToProfile
                  caption={
                    <span className="tabular-nums">{formatXp(friend.xp)}</span>
                  }
                  className="flex-1"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasNothingInCommon ? (
        <EmptyState>
          Vocês ainda não têm turmas nem amigos em comum.
        </EmptyState>
      ) : null}
    </main>
  );
}
