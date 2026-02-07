import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useToaster } from "@/components/feedback/useToaster";
import { useAuth } from "@/domains/auth/useAuth";
import { formatBRL, toNumber } from "@/utils/format";
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  updateInvestment,
  type Investment,
  type LiquidityType
} from "@/domains/investments/investmentsService";
import { listGoals, type Goal } from "@/domains/goals/goalsService";
import { recalcGoalInvestedAmount } from "@/domains/goals/goalsRecalc";

type FormState = {
  id?: string;

  invested_at: string;
  amount: string;

  asset_class: string;
  liquidity_type: LiquidityType;
  maturity_date: string;

  institution_name: string;

  goal_id: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  invested_at: todayISO(),
  amount: "",
  asset_class: "",
  liquidity_type: "diaria",
  maturity_date: "",
  institution_name: "",
  goal_id: ""
};

function normalizeAssetClass(value: string) {
  return value.trim();
}

function asNullable(value: string): string | null {
  const v = value.trim();
  return v ? v : null;
}

function parseAmount(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export function InvestmentsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const toaster = useToaster();

  const [items, setItems] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ assetClass: "", dateFrom: "", dateTo: "" });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const total = items.reduce((acc, it) => acc + toNumber(it.amount, 0), 0);
    return { total };
  }, [items]);

  const assetClasses = useMemo(() => {
    const set = new Set(items.map((i) => i.asset_class).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  async function reloadAll() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [inv, gs] = await Promise.all([
        listInvestments(userId, {
          assetClass: filters.assetClass.trim() ? filters.assetClass.trim() : undefined,
          dateFrom: filters.dateFrom.trim() ? filters.dateFrom.trim() : undefined,
          dateTo: filters.dateTo.trim() ? filters.dateTo.trim() : undefined
        }),
        listGoals(userId)
      ]);
      setItems(inv);
      setGoals(gs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function applyFilters() {
    await reloadAll();
  }

  function startEdit(it: Investment) {
    setForm({
      id: it.id,
      invested_at: it.invested_at ?? todayISO(),
      amount: String(it.amount ?? ""),
      asset_class: it.asset_class ?? "",
      liquidity_type: it.liquidity_type ?? "diaria",
      maturity_date: it.maturity_date ?? "",
      institution_name: it.institution_name ?? "",
      goal_id: it.goal_id ?? ""
    });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function validateForm():
    | { ok: true; payload: any; nextGoal: string | null }
    | { ok: false } {
    const invested_at = form.invested_at.trim();
    const amount = parseAmount(form.amount);
    const asset_class = normalizeAssetClass(form.asset_class);
    const liquidity_type = form.liquidity_type;

    if (!invested_at) {
      toaster.show({ title: "Data obrigatória", message: "Informe a data do investimento.", variant: "warning" });
      return { ok: false };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toaster.show({ title: "Valor inválido", message: "Informe um valor maior que zero.", variant: "warning" });
      return { ok: false };
    }
    if (!asset_class) {
      toaster.show({ title: "Classe obrigatória", message: "Informe a classe do investimento.", variant: "warning" });
      return { ok: false };
    }

    const maturity_date = form.maturity_date.trim();
    if (liquidity_type === "no_vencimento" && !maturity_date) {
      toaster.show({
        title: "Vencimento obrigatório",
        message: "Para liquidez no vencimento, informe a data de vencimento.",
        variant: "warning"
      });
      return { ok: false };
    }
    if (liquidity_type === "diaria" && maturity_date) {
      toaster.show({
        title: "Vencimento não permitido",
        message: "Para liquidez diária, não informe data de vencimento.",
        variant: "warning"
      });
      return { ok: false };
    }

    const nextGoal = asNullable(form.goal_id);
    const payload = {
      user_id: userId,
      invested_at,
      amount,
      asset_class,
      liquidity_type,
      maturity_date: liquidity_type === "no_vencimento" ? maturity_date : null,
      institution_name: asNullable(form.institution_name),
      goal_id: nextGoal
    };

    return { ok: true, payload, nextGoal };
  }

  async function onSubmit() {
    if (!userId) return;

    const v = validateForm();
    if (!v.ok) return;

    setSaving(true);
    try {
      const prev = form.id ? items.find((x) => x.id === form.id) : null;
      const prevGoal = prev?.goal_id ?? null;

      if (form.id) {
        await updateInvestment(form.id, userId, v.payload);
        toaster.show({ title: "Investimento atualizado", variant: "success" });
      } else {
        await createInvestment(v.payload);
        toaster.show({ title: "Investimento criado", variant: "success" });
      }

      const affected = new Set<string>();
      if (prevGoal) affected.add(prevGoal);
      if (v.nextGoal) affected.add(v.nextGoal);

      for (const gid of affected) {
        await recalcGoalInvestedAmount(userId, gid);
      }

      resetForm();
      await reloadAll();
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

  async function onDelete(it: Investment) {
    if (!userId) return;
    const ok = confirm("Remover este investimento?");
    if (!ok) return;

    try {
      const goalId = it.goal_id;
      await deleteInvestment(it.id, userId);
      if (goalId) await recalcGoalInvestedAmount(userId, goalId);

      toaster.show({ title: "Investimento removido", variant: "success" });
      await reloadAll();
      if (form.id === it.id) resetForm();
    } catch (e) {
      toaster.show({
        title: "Não foi possível remover",
        message: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "danger"
      });
    }
  }

  const maturityDisabled = form.liquidity_type === "diaria";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Investimentos</h1>
        <p className="mt-1 text-sm text-muted">Registre aportes e acompanhe sua evolução.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted">Total investido (filtros aplicados)</div>
            <div className="text-xl font-semibold">{formatBRL(totals.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Quantidade</div>
            <div className="text-xl font-semibold">{items.length}</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="font-semibold">{form.id ? "Editar investimento" : "Novo investimento"}</div>

          <div className="mt-4 space-y-4">
            <Input
              label="Data"
              type="date"
              value={form.invested_at}
              onChange={(e) => setForm((s) => ({ ...s, invested_at: e.target.value }))}
              required
            />

            <Input
              label="Valor (R$)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              required
            />

            <Input
              label="Classe"
              placeholder="Ex.: Renda Fixa, Ações, FIIs..."
              value={form.asset_class}
              onChange={(e) => setForm((s) => ({ ...s, asset_class: e.target.value }))}
              required
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">Liquidez</div>
              <div className="flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="liquidity"
                    checked={form.liquidity_type === "diaria"}
                    onChange={() => setForm((s) => ({ ...s, liquidity_type: "diaria", maturity_date: "" }))}
                  />
                  Diária
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="liquidity"
                    checked={form.liquidity_type === "no_vencimento"}
                    onChange={() => setForm((s) => ({ ...s, liquidity_type: "no_vencimento" }))}
                  />
                  No vencimento
                </label>
              </div>
            </div>

            <Input
              label="Data de vencimento"
              type="date"
              value={form.maturity_date}
              onChange={(e) => setForm((s) => ({ ...s, maturity_date: e.target.value }))}
              disabled={maturityDisabled}
              required={!maturityDisabled}
              hint={maturityDisabled ? "Habilita ao selecionar 'No vencimento'." : undefined}
            />

            <Input
              label="Instituição"
              placeholder="Ex.: Itaú, Nubank, XP..."
              value={form.institution_name}
              onChange={(e) => setForm((s) => ({ ...s, institution_name: e.target.value }))}
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">Meta (opcional)</div>
              <select
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                value={form.goal_id}
                onChange={(e) => setForm((s) => ({ ...s, goal_id: e.target.value }))}
              >
                <option value="">Sem meta</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted">
                Ao salvar, o valor aportado da meta será recalculado a partir dos investimentos vinculados.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => void onSubmit()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={saving}>
                Limpar
              </Button>
            </div>

            <div className="text-xs text-muted">
              Observação: <span className="text-fg">user_id</span> é enviado explicitamente (RLS ativo).
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">Lista</div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-3">
              <div className="text-sm font-medium">Filtros</div>

              <select
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                value={filters.assetClass}
                onChange={(e) => setFilters((s) => ({ ...s, assetClass: e.target.value }))}
              >
                <option value="">Todas as classes</option>
                {assetClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="grid gap-3">
                <Input
                  label="De"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((s) => ({ ...s, dateFrom: e.target.value }))}
                />
                <Input
                  label="Até"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((s) => ({ ...s, dateTo: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => void applyFilters()} disabled={loading}>
                  Aplicar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters({ assetClass: "", dateFrom: "", dateTo: "" });
                    void setTimeout(() => void reloadAll(), 0);
                  }}
                  disabled={loading}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="mt-2 text-sm text-muted">Carregando...</div>
            ) : error ? (
              <div className="mt-2">
                <ErrorState message={error} onRetry={() => void reloadAll()} />
              </div>
            ) : items.length === 0 ? (
              <div className="mt-2">
                <EmptyState title="Nenhum investimento" message="Cadastre seu primeiro investimento ao lado." />
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{formatBRL(it.amount as any)}</div>
                        <div className="mt-1 text-xs text-muted">
                          {it.invested_at} • {it.asset_class} •{" "}
                          {it.liquidity_type === "diaria" ? "Diária" : "No vencimento"}
                          {it.maturity_date ? ` • Vence em ${it.maturity_date}` : ""}
                          {it.institution_name ? ` • ${it.institution_name}` : ""}
                          {it.goal_id ? ` • Vinculado a meta` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => startEdit(it)}>
                          Editar
                        </Button>
                        <Button variant="danger" onClick={() => void onDelete(it)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
