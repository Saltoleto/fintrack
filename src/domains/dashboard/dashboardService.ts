import { listInvestments, type Investment } from "@/domains/investments/investmentsService";
import { listGoals, type Goal } from "@/domains/goals/goalsService";
import { listAllocationTargets, type AllocationTarget } from "@/domains/allocation/allocationService";
import { listAssetClasses, type AssetClass } from "@/domains/reference/assetClassesService";
import { toNumber } from "@/utils/format";
import { embedName } from "@/utils/embeds";

export type DashboardClassRow = {
  asset_class_id: string;
  name: string;
  total_amount: number;
  real_percent: number;
  target_percent: number | null;
  diff_percent: number | null; // real - target
};

export type DashboardGoalRow = {
  id: string;
  title: string;
  target_amount: number;
  invested_amount: number;
  progress_percent: number; // 0..100
  priority: number;
};

export type DashboardInsights = {
  noInvestmentsThisMonth: boolean;
  targetNotClosedTo100: boolean;
  goalTopUpSuggestion: { goalId: string; goalTitle: string; missingAmount: number } | null;
  concentrationWarning: { assetClassId: string; className: string; realPercent: number; targetPercent: number } | null;
};

export type DashboardData = {
  totalPatrimony: number;
  classes: DashboardClassRow[];
  goals: DashboardGoalRow[];
  insights: DashboardInsights;
};

function monthKey(isoDate: string): string {
  // isoDate = YYYY-MM-DD
  return isoDate.slice(0, 7);
}

function safeProgress(invested: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const p = (invested / target) * 100;
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export async function loadDashboard(userId: string): Promise<DashboardData> {
  const [investments, goals, allocation, classes] = await Promise.all([
    listInvestments(userId),
    listGoals(userId),
    listAllocationTargets(userId),
    listAssetClasses()
  ]);

  const classNameById = new Map<string, string>(classes.map((c: AssetClass) => [c.id, c.name]));

  const totalPatrimony = investments.reduce((acc, inv: Investment) => acc + toNumber(inv.amount, 0), 0);

  // Totals per class
  const totalByClass = new Map<string, number>();
  for (const inv of investments) {
    const id = inv.asset_class_id;
    const prev = totalByClass.get(id) ?? 0;
    totalByClass.set(id, prev + toNumber(inv.amount, 0));
  }

  // Target by class
  const targetByClass = new Map<string, number>();
  for (const t of allocation) {
    targetByClass.set(t.asset_class_id, toNumber(t.target_percent, 0));
  }

  const rows: DashboardClassRow[] = Array.from(totalByClass.entries()).map(([asset_class_id, total_amount]) => {
    const name =
      classNameById.get(asset_class_id) ??
      embedName((investments.find((i) => i.asset_class_id === asset_class_id) as any)?.asset_classes) ??
      "—";
    const real_percent = totalPatrimony > 0 ? (total_amount / totalPatrimony) * 100 : 0;
    const target_percent = targetByClass.has(asset_class_id) ? (targetByClass.get(asset_class_id) as number) : null;
    const diff_percent = target_percent === null ? null : real_percent - target_percent;
    return { asset_class_id, name, total_amount, real_percent, target_percent, diff_percent };
  });

  rows.sort((a, b) => b.total_amount - a.total_amount);

  const goalRows: DashboardGoalRow[] = goals
    .map((g: Goal) => {
      const target_amount = toNumber(g.target_amount, 0);
      const invested_amount = toNumber(g.invested_amount, 0);
      return {
        id: g.id,
        title: g.title,
        target_amount,
        invested_amount,
        progress_percent: safeProgress(invested_amount, target_amount),
        priority: g.priority
      };
    })
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  // Insights
  const now = new Date();
  const key = now.toISOString().slice(0, 7); // YYYY-MM in UTC; acceptable for month-based insight
  const noInvestmentsThisMonth = investments.filter((i) => monthKey(i.invested_at) === key).length === 0;

  const totalTarget = Array.from(targetByClass.values()).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const targetNotClosedTo100 = totalTarget > 0 && totalTarget < 100;

  // Suggestion: smallest top-up to reach a goal (prioritize smaller missing amount)
  const goalTopUpSuggestion =
    goalRows
      .map((g) => ({ g, missing: Math.max(0, g.target_amount - g.invested_amount) }))
      .filter((x) => x.missing > 0)
      .sort((a, b) => a.missing - b.missing)[0] ?? null;

  // Concentration warning: alert when REAL allocation exceeds configured TARGET for that class
  const mostConcentrated = rows[0] ?? null;
  const concentrationWarning =
    mostConcentrated && mostConcentrated.target_percent !== null && mostConcentrated.real_percent > mostConcentrated.target_percent
      ? {
          assetClassId: mostConcentrated.asset_class_id,
          className: mostConcentrated.name,
          realPercent: mostConcentrated.real_percent,
          targetPercent: mostConcentrated.target_percent
        }
      : null;

  return {
    totalPatrimony,
    classes: rows,
    goals: goalRows,
    insights: {
      noInvestmentsThisMonth,
      targetNotClosedTo100,
      goalTopUpSuggestion: goalTopUpSuggestion ? { goalId: goalTopUpSuggestion.g.id, goalTitle: goalTopUpSuggestion.g.title, missingAmount: goalTopUpSuggestion.missing } : null,
      concentrationWarning
    }
  };
}
