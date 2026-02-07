import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useAuth } from "@/domains/auth/useAuth";
import { loadDashboard, type DashboardData } from "@/domains/dashboard/dashboardService";
import { formatBRL } from "@/utils/format";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await loadDashboard(userId);
      setData(d);
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

  const insights = useMemo(() => {
    if (!data) return [];
    const list: Array<{ title: string; body: string }> = [];

    if (data.insights.noInvestmentsThisMonth) {
      list.push({
        title: "Sem investimentos no mês",
        body: "Este mês você ainda não realizou nenhum investimento."
      });
    }

    if (data.insights.targetNotClosedTo100) {
      const totalTarget = data.classes.reduce((acc, r) => acc + (r.target_percent ?? 0), 0);
      list.push({
        title: "Alocação alvo incompleta",
        body: `Sua alocação alvo ainda não fecha 100%. Total configurado: ${totalTarget.toFixed(0)}%.`
      });
    }

    return list;
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="text-sm text-muted">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <ErrorState message={error} onRetry={() => void reload()} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <EmptyState title="Sem dados" message="Não foi possível carregar o dashboard." />
      </div>
    );
  }

  const hasInvestments = data.totalPatrimony > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Visão gerencial da sua carteira.</p>
      </div>

      <Card className="p-6">
        <div className="text-sm text-muted">Patrimônio</div>
        <div className="mt-1 text-2xl font-semibold">{formatBRL(data.totalPatrimony)}</div>
      </Card>

      {!hasInvestments ? (
        <Card className="p-6">
          <EmptyState title="Nenhum investimento cadastrado" message="Cadastre seus investimentos para ver métricas aqui." />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="font-semibold">Concentração por classe</div>
            <div className="mt-4 space-y-2">
              {data.classes.map((r) => (
                <div key={r.asset_class_id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="mt-1 text-xs text-muted">Total: {formatBRL(r.total_amount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{pct(r.real_percent)}</div>
                      <div className="mt-1 text-xs text-muted">
                        Alvo: {r.target_percent === null ? "—" : `${r.target_percent.toFixed(0)}%`}
                      </div>
                      {r.diff_percent !== null ? (
                        <div className="mt-1 text-xs text-muted">Diferença: {pct(r.diff_percent)}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-semibold">Metas</div>
            <div className="mt-4 space-y-2">
              {data.goals.length === 0 ? (
                <EmptyState title="Nenhuma meta cadastrada" message="Cadastre metas para acompanhar o progresso." />
              ) : (
                data.goals.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{g.title}</div>
                        <div className="mt-1 text-xs text-muted">
                          {formatBRL(g.invested_amount)} / {formatBRL(g.target_amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{pct(g.progress_percent)}</div>
                        <div className="mt-2 h-2 w-32 rounded-xl bg-border overflow-hidden">
                          <div className="h-full bg-fg" style={{ width: `${g.progress_percent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {insights.length > 0 ? (
        <Card className="p-6">
          <div className="font-semibold">Insights</div>
          <div className="mt-4 space-y-2">
            {insights.map((i) => (
              <div key={i.title} className="rounded-xl border border-border p-3">
                <div className="font-medium">{i.title}</div>
                <div className="mt-1 text-sm text-muted">{i.body}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
