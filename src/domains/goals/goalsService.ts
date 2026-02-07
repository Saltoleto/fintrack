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
  return (data ?? []) as Goal[];
}

export async function createGoal(input: {
  user_id: string;
  title: string;
  target_amount: number;
  invested_amount: number;
  priority: number;
}): Promise<Goal> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("goals")
    .insert({ ...input, updated_at: now })
    .select("*")
    .single();

  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(
  id: string,
  userId: string,
  patch: Partial<Pick<Goal, "title" | "target_amount" | "invested_amount" | "priority">>
): Promise<Goal> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("goals")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string, userId: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
