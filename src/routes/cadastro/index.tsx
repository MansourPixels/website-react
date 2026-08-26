import { Button, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useAuth } from "@/contexts/AuthContext";
import { NEXT_ROUTE_PARAM } from "@/utils/authRedirect";
import {
  isValidEmail,
  MIN_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../-auth/validation";
import { PasswordField } from "../-auth/PasswordField";

export default function CadastroPage() {
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const nextRoute = searchParams.get(NEXT_ROUTE_PARAM);
  const signInHref =
    nextRoute === null
      ? "/entrar"
      : `/entrar?${NEXT_ROUTE_PARAM}=${encodeURIComponent(nextRoute)}`;

  const isValid =
    form.name.trim().length >= MIN_NAME_LENGTH &&
    isValidEmail(form.email) &&
    form.password.length >= MIN_PASSWORD_LENGTH;

  function updateForm(changes: Partial<typeof form>) {
    setError(null);
    setForm((previous) => ({ ...previous, ...changes }));
  }

  // O redirecionamento após o sucesso é feito pelo layout de autenticação,
  // que observa o status da sessão.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) return;

    const result = signUp(form.name, form.email, form.password);

    if (!result.ok) setError(result.error);
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-muted text-sm text-pretty">
          Sua conta guarda a sua ascensão e o seu material de estudo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField className="w-full">
          <Label htmlFor="nome-cadastro">Nome</Label>
          <Input
            id="nome-cadastro"
            value={form.name}
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            onChange={(event) => updateForm({ name: event.target.value })}
          />
        </TextField>

        <TextField className="w-full" type="email">
          <Label htmlFor="email-cadastro">E-mail</Label>
          <Input
            id="email-cadastro"
            value={form.email}
            autoComplete="email"
            placeholder="voce@email.com"
            onChange={(event) => updateForm({ email: event.target.value })}
          />
        </TextField>

        <PasswordField
          id="senha-cadastro"
          label="Senha"
          value={form.password}
          autoComplete="new-password"
          onChange={(password) => updateForm({ password })}
          hint={`No mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
        />

        {error !== null ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isDisabled={!isValid}>
          Criar conta
        </Button>
      </form>

      <p className="text-muted text-center text-sm">
        Já tem uma conta?{" "}
        <Link
          to={signInHref}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-accent",
          })}
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
