import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useAuth } from "@/domains/auth/useAuth";
import { loadDashboard, type DashboardData } from "@/domains/dashboard/dashboardService";
import { formatBRL } from "@/utils/format";
import { toUserFriendlyError } from "@/utils/errors";

function toneFromProgress(p: number): "ok" | "warn" | "done" {
  if (p >= 100) return "done";
  if (p >= 80) return "warn";
  return "ok";
}

function toneFromConcentration(real: number, target: number | null): "ok" | "warn" {
  if (target === null) return real >= 50 ? "warn" : "ok";
  return real - target >= 10 ? "warn" : "ok";
}

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
      setError(toUserFriendlyError(e, "dashboard.load"));
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

    if (data.insights.goalTopUpSuggestion) {
      list.push({
        title: "Aporte sugerido para bater uma meta",
        body: `Com ${formatBRL(data.insights.goalTopUpSuggestion.missingAmount)} você atinge a meta “${data.insights.goalTopUpSuggestion.goalTitle}”.`
      });
    }

    if (data.insights.concentrationWarning) {
      list.push({
        title: "Carteira muito concentrada",
        body: `Sua carteira está muito concentrada na classe ${data.insights.concentrationWarning.className} (${data.insights.concentrationWarning.realPercent.toFixed(
          1
        )}%).`
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="font-semibold">Concentração por classe</div>
          <div className="mt-4 space-y-2">
            {!hasInvestments ? (
              <EmptyState
                title="Nenhum investimento cadastrado"
                message="Cadastre seus investimentos para ver a concentração real por classe."
              />
            ) : (
              data.classes.map((r) => {
                const tone = toneFromConcentration(r.real_percent, r.target_percent);
                const borderColor = tone === "warn" ? "rgb(var(--warning))" : "rgb(var(--border))";

                return (
                  <div
                    key={r.asset_class_id}
                    style={{
                      border: `1px solid ${borderColor}`,
                      borderRadius: 16,
                      padding: 12
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="mt-1 text-xs text-muted">Total: {formatBRL(r.total_amount)}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
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
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">Metas</div>
          <div className="mt-4 space-y-2">
            {data.goals.length === 0 ? (
              <EmptyState title="Nenhuma meta cadastrada" message="Cadastre metas para acompanhar o progresso." />
            ) : (
              data.goals.map((g) => {
                const tone = toneFromProgress(g.progress_percent);
                const borderColor =
                  tone === "done"
                    ? "rgb(var(--success))"
                    : tone === "warn"
                      ? "rgb(var(--warning))"
                      : "rgb(var(--border))";

                return (
                  <div
                    key={g.id}
                    style={{
                      border: `1px solid ${borderColor}`,
                      borderRadius: 16,
                      padding: 12
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div className="font-medium">{g.title}</div>
                        <div className="mt-1 text-xs text-muted">
                          {formatBRL(g.invested_amount)} / {formatBRL(g.target_amount)}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="text-sm font-semibold">{pct(g.progress_percent)}</div>
                        <div className="mt-2" style={{ width: 180 }}>
                          <ProgressBar
                            value={g.progress_percent}
                            tone={tone === "done" ? "success" : tone === "warn" ? "warning" : "neutral"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

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