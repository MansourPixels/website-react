import { Button, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { NEXT_ROUTE_PARAM } from "@/utils/authRedirect";
import { isValidEmail, MIN_PASSWORD_LENGTH } from "../-auth/validation";
import { PasswordField } from "../-auth/PasswordField";

export default function EntrarPage() {
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const nextRoute = searchParams.get(NEXT_ROUTE_PARAM);
  const signUpHref =
    nextRoute === null
      ? "/cadastro"
      : `/cadastro?${NEXT_ROUTE_PARAM}=${encodeURIComponent(nextRoute)}`;

  const isValid =
    isValidEmail(form.email) && form.password.length >= MIN_PASSWORD_LENGTH;

  function updateForm(changes: Partial<typeof form>) {
    setError(null);
    setForm((previous) => ({ ...previous, ...changes }));
  }

  // O redirecionamento após o sucesso é feito pelo layout de autenticação,
  // que observa o status da sessão.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) return;

    const result = signIn(form.email, form.password);

    if (!result.ok) setError(result.error);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-muted text-sm text-pretty">
          Acesse sua conta para continuar de onde parou.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField className="w-full" type="email">
          <Label htmlFor="email-login">E-mail</Label>
          <Input
            id="email-login"
            value={form.email}
            autoComplete="email"
            placeholder="voce@email.com"
            onChange={(event) => updateForm({ email: event.target.value })}
          />
        </TextField>

        <PasswordField
          id="senha-login"
          label="Senha"
          value={form.password}
          onChange={(password) => updateForm({ password })}
        />

        {error !== null ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isDisabled={!isValid}>
          Entrar
        </Button>
      </form>

      <p className="text-muted text-center text-sm">
        Ainda não tem conta?{" "}
        <Link
          to={signUpHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Criar conta
        </Link>
      </p>
    </>
  );
}
