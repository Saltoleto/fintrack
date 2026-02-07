import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useToaster } from "@/components/feedback/useToaster";
import { useAuth } from "@/domains/auth/useAuth";
import { createGoal, deleteGoal, listGoals, type Goal, updateGoal } from "@/domains/goals/goalsService";
import { formatBRL, toNumber } from "@/utils/format";

type FormState = {
  id?: string;
  title: string;
  target_amount: string;
  invested_amount: string;
  priority: string;
};

const emptyForm: FormState = { title: "", target_amount: "", invested_amount: "0", priority: "3" };

export function GoalsPage() {
  const { user } = useAuth();
  const toaster = useToaster();

  const [items, setItems] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const userId = user?.id ?? "";

  const totals = useMemo(() => {
    const target = items.reduce((acc, g) => acc + toNumber(g.target_amount, 0), 0);
    const invested = items.reduce((acc, g) => acc + toNumber(g.invested_amount, 0), 0);
    return { target, invested };
  }, [items]);

  async function reload() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listGoals(userId);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function startEdit(goal: Goal) {
    setForm({
      id: goal.id,
      title: goal.title ?? "",
      target_amount: String(goal.target_amount ?? ""),
      invested_amount: String(goal.invested_amount ?? "0"),
      priority: String(goal.priority ?? 3)
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  async function onSubmit() {
    if (!userId) return;

    const title = form.title.trim();
    if (!title) {
      toaster.show({ title: "Título obrigatório", message: "Informe o nome da meta.", variant: "warning" });
      return;
    }

    const target = Number(form.target_amount);
    const invested = Number(form.invested_amount);
    const priority = Number(form.priority);

    if (!Number.isFinite(target) || target < 0) {
      toaster.show({ title: "Valor da meta inválido", message: "Informe um valor válido.", variant: "warning" });
      return;
    }
    if (!Number.isFinite(invested) || invested < 0) {
      toaster.show({ title: "Valor aportado inválido", message: "Informe um valor válido.", variant: "warning" });
      return;
    }
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      toaster.show({ title: "Prioridade inválida", message: "Use um valor entre 1 e 5.", variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await updateGoal(form.id, userId, { title, target_amount: target, invested_amount: invested, priority });
        toaster.show({ title: "Meta atualizada", variant: "success" });
      } else {
        await createGoal({ user_id: userId, title, target_amount: target, invested_amount: invested, priority });
        toaster.show({ title: "Meta criada", variant: "success" });
      }

      resetForm();
      await reload();
    } catch (e) {
      toaster.show({
        title: "Não foi possível salvar",
        message: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(goal: Goal) {
    if (!userId) return;
    const ok = confirm(`Remover a meta "${goal.title}"?`);
    if (!ok) return;

    try {
      await deleteGoal(goal.id, userId);
      toaster.show({ title: "Meta removida", variant: "success" });
      await reload();
      if (form.id === goal.id) resetForm();
    } catch (e) {
      toaster.show({
        title: "Não foi possível remover",
        message: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "danger"
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Metas</h1>
          <p className="mt-1 text-sm text-muted">Crie e acompanhe metas da sua carteira.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted">Total investido em metas</div>
            <div className="text-xl font-semibold">{formatBRL(totals.invested)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Total de metas</div>
            <div className="text-xl font-semibold">{formatBRL(totals.target)}</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="font-semibold">{form.id ? "Editar meta" : "Nova meta"}</div>
          <div className="mt-4 space-y-4">
            <Input
              label="Título"
              placeholder="Ex.: Reserva de emergência"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
            <Input
              label="Valor da meta (R$)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.target_amount}
              onChange={(e) => setForm((s) => ({ ...s, target_amount: e.target.value }))}
              required
            />
            <Input
              label="Valor aportado (R$)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.invested_amount}
              onChange={(e) => setForm((s) => ({ ...s, invested_amount: e.target.value }))}
            />
            <Input
              label="Prioridade (1 a 5)"
              type="number"
              inputMode="numeric"
              placeholder="3"
              value={form.priority}
              onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value }))}
              min={1}
              max={5}
            />

            <div className="flex items-center gap-2">
              <Button onClick={() => void onSubmit()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={saving}>
                Limpar
              </Button>
            </div>

            <div className="text-xs text-muted">
              Observação: <span className="text-fg">user_id</span> é enviado explicitamente pela aplicação (sem trigger).
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">Suas metas</div>

          {loading ? (
            <div className="mt-4 text-sm text-muted">Carregando...</div>
          ) : error ? (
            <div className="mt-4">
              <ErrorState message={error} onRetry={() => void reload()} />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma meta cadastrada" message="Crie sua primeira meta ao lado." />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((g) => {
                const target = toNumber(g.target_amount);
                const invested = toNumber(g.invested_amount);
                const progress = target > 0 ? Math.min(100, Math.round((invested / target) * 100)) : 0;

                return (
                  <div key={g.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{g.title}</div>
                        <div className="mt-1 text-xs text-muted">
                          {formatBRL(invested)} / {formatBRL(target)} • Prioridade {g.priority} • {progress}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => startEdit(g)}>
                          Editar
                        </Button>
                        <Button variant="danger" onClick={() => void onDelete(g)}>
                          Remover
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-border" style={{ overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: 8, background: "rgba(99,102,241,0.85)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
