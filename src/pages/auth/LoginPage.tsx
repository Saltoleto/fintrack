import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMemo, useState } from "react";
import { useToaster } from "@/components/feedback/useToaster";
import { signInWithEmail } from "@/domains/auth/authService";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/dashboard";
  }, [location.state]);

  const emailError = email.length > 0 && !isEmail(email) ? "Informe um e-mail válido." : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="mt-1 text-sm text-muted">Acesse sua carteira de investimentos.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isEmail(email)) {
            toaster.show({ title: "E-mail inválido", message: "Verifique o e-mail informado.", variant: "warning" });
            return;
          }
          setSubmitting(true);
          try {
            await signInWithEmail(email.trim(), password);
            toaster.show({ title: "Bem-vindo!", message: "Login realizado com sucesso.", variant: "success" });
            navigate(from, { replace: true });
          } catch (err) {
            toaster.show({
              title: "Não foi possível entrar",
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="link" to="/forgot">
          Esqueci minha senha
        </Link>
        <Link className="link" to="/signup">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
