import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useEffect, useState } from "react";
import { useToaster } from "@/components/feedback/useToaster";
import { updatePassword } from "@/domains/auth/authService";
import { supabase } from "@/services/supabase";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toaster = useToaster();
  const navigate = useNavigate();

  useEffect(() => {
    // Quando o usuário abre o link de recuperação, o Supabase injeta sessão via URL
    // e detectSessionInUrl=true deve capturar isso.
    // Ainda assim, forçamos uma leitura de sessão para garantir UX.
    supabase.auth.getSession().catch(() => {
      // silencioso: qualquer erro será tratado no submit.
    });
  }, []);

  const passwordError = password.length > 0 && password.length < 8 ? "Use pelo menos 8 caracteres." : undefined;
  const confirmError =
    confirm.length > 0 && confirm !== password ? "As senhas não conferem." : undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
      <p className="mt-1 text-sm text-muted">Defina uma nova senha para sua conta.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();

          if (password.length < 8) {
            toaster.show({ title: "Senha fraca", message: "Use pelo menos 8 caracteres.", variant: "warning" });
            return;
          }
          if (password !== confirm) {
            toaster.show({ title: "Senhas diferentes", message: "Confirme a mesma senha.", variant: "warning" });
            return;
          }

          setSubmitting(true);
          try {
            await updatePassword(password);
            toaster.show({ title: "Senha atualizada", message: "Você já pode entrar com a nova senha.", variant: "success" });
            navigate("/login", { replace: true });
          } catch (err) {
            toaster.show({
              title: "Não foi possível redefinir",
              message: err instanceof Error ? err.message : "Erro desconhecido",
              variant: "danger"
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
          required
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>

      <div className="mt-4 text-sm">
        <Link className="link" to="/login">
          Voltar para login
        </Link>
      </div>
    </div>
  );
}
