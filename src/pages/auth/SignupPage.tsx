import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { useToaster } from "@/components/feedback/useToaster";
import { signUpWithEmail } from "@/domains/auth/authService";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function passwordStrengthHint(password: string) {
  if (password.length === 0) return undefined;
  if (password.length < 8) return "Use pelo menos 8 caracteres.";
  return undefined;
}

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toaster = useToaster();
  const navigate = useNavigate();

  const emailError = email.length > 0 && !isEmail(email) ? "Informe um e-mail válido." : undefined;
  const passwordError = password.length > 0 && password.length < 8 ? "A senha deve ter pelo menos 8 caracteres." : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold">Criar conta</h1>
      <p className="mt-1 text-sm text-muted">Crie sua conta para começar.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isEmail(email)) {
            toaster.show({ title: "E-mail inválido", message: "Verifique o e-mail informado.", variant: "warning" });
            return;
          }
          if (password.length < 8) {
            toaster.show({ title: "Senha fraca", message: "Use pelo menos 8 caracteres.", variant: "warning" });
            return;
          }

          setSubmitting(true);
          try {
            const res = await signUpWithEmail(email.trim(), password);

            // Supabase pode exigir confirmação de e-mail dependendo do projeto.
            const needsConfirmation = !res.session;

            toaster.show({
              title: "Conta criada",
              message: needsConfirmation
                ? "Verifique seu e-mail para confirmar o cadastro e depois faça login."
                : "Cadastro realizado com sucesso.",
              variant: "success"
            });

            navigate("/login", { replace: true });
          } catch (err) {
            toaster.show({
              title: "Não foi possível criar a conta",
              message: err instanceof Error ? err.message : "Erro desconhecido",
              variant: "danger"
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          required
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint={passwordStrengthHint(password)}
          placeholder="Crie uma senha forte"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          required
        />
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-4 text-sm">
        <span className="text-muted">Já tem conta?</span>{" "}
        <Link className="link" to="/login">
          Entrar
        </Link>
      </div>
    </div>
  );
}
