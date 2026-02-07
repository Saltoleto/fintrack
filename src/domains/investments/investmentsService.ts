import { supabase } from "@/services/supabase";

export type LiquidityType = "diaria" | "no_vencimento";

export type Investment = {
  id: string;
  user_id: string;

  invested_at: string; // YYYY-MM-DD
  amount: string | number;

  asset_class: string;
  liquidity_type: LiquidityType;
  maturity_date: string | null; // YYYY-MM-DD
  institution_name: string | null;

  goal_id: string | null;

  created_at: string;
  updated_at: string;
};

export type InvestmentFilters = {
  assetClass?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
};

export async function listInvestments(userId: string, filters: InvestmentFilters = {}): Promise<Investment[]> {
  let q = supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("invested_at", { ascending: false });

  if (filters.assetClass) q = q.eq("asset_class", filters.assetClass);
  if (filters.dateFrom) q = q.gte("invested_at", filters.dateFrom);
  if (filters.dateTo) q = q.lte("invested_at", filters.dateTo);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Investment[];
}

export async function createInvestment(input: {
  user_id: string;
  invested_at: string;
  amount: number;
  asset_class: string;
  liquidity_type: LiquidityType;
  maturity_date: string | null;
  institution_name: string | null;
  goal_id: string | null;
}): Promise<Investment> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("investments")
    .insert({ ...input, updated_at: now })
    .select("*")
    .single();

  if (error) throw error;
  return data as Investment;
}

export async function updateInvestment(
  id: string,
  userId: string,
  patch: Partial<
    Pick<
      Investment,
      "invested_at" | "amount" | "asset_class" | "liquidity_type" | "maturity_date" | "institution_name" | "goal_id"
    >
  >
): Promise<Investment> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("investments")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Investment;
}

export async function deleteInvestment(id: string, userId: string) {
  const { error } = await supabase.from("investments").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function sumInvestmentsByGoal(userId: string, goalId: string): Promise<number> {
  const { data, error } = await supabase
    .from("investments")
    .select("amount")
    .eq("user_id", userId)
    .eq("goal_id", goalId);

  if (error) throw error;

  const rows = (data ?? []) as Array<{ amount: string | number }>;
  return rows.reduce((acc, r) => {
    const n = typeof r.amount === "string" ? Number(r.amount) : r.amount;
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}
