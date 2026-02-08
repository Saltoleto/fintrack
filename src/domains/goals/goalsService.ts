import { supabase } from "@/services/supabase";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  target_amount: string | number;
  invested_amount: string | number;
  priority: number;
  created_at: string;
  updated_at: string;
};

export async function listGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const goals = (data ?? []) as Goal[];
  if (goals.length === 0) return goals;

  // Fonte de verdade do "aportado": soma dos investimentos vinculados (sem triggers).
  const goalIds = goals.map((g) => g.id);
  const { data: invData, error: invErr } = await supabase
    .from("investments")
    .select("goal_id,amount")
    .eq("user_id", userId)
    .in("goal_id", goalIds);

  if (invErr) throw invErr;

  const sums = new Map<string, number>();
  for (const row of (invData ?? []) as Array<{ goal_id: string | null; amount: string | number }>) {
    if (!row.goal_id) continue;
    const n = typeof row.amount === "string" ? Number(row.amount) : row.amount;
    sums.set(row.goal_id, (sums.get(row.goal_id) ?? 0) + (Number.isFinite(n) ? n : 0));
  }

  // Sobrescreve invested_amount para refletir o total calculado.
  return goals.map((g) => ({ ...g, invested_amount: sums.get(g.id) ?? 0 }));
}


export async function createGoal(input: {
  user_id: string;
  title: string;
  target_amount: number;
    priority: number;
}): Promise<Goal> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("goals")
    .insert({ invested_amount: 0, ...input, updated_at: now })
    .select("*")
    .single();

  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(
  id: string,
  userId: string,
  patch: Partial<Pick<Goal, "title" | "target_amount" | "priority">>
): Promise<Goal> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("goals")
    .update({ ...patch, invested_amount: undefined, updated_at: now })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Goal;
}

export async function updateGoalInvestedAmount(goalId: string, userId: string, investedAmount: number): Promise<void> {
  const now = new Date().toISOString();
  // This update is internal: invested_amount is derived from linked investments.
  const { error } = await supabase
    .from("goals")
    .update({ invested_amount: investedAmount, updated_at: now })
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteGoal(id: string, userId: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
