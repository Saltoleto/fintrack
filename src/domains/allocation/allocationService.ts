import { supabase } from "@/services/supabase";

export type AllocationTarget = {
  id: string;
  user_id: string;
  asset_class: string;
  target_percent: string | number;
  created_at: string;
  updated_at: string;
};

export async function listAllocationTargets(userId: string): Promise<AllocationTarget[]> {
  const { data, error } = await supabase
    .from("allocation_targets")
    .select("*")
    .eq("user_id", userId)
    .order("asset_class", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AllocationTarget[];
}

export async function upsertAllocationTarget(input: {
  user_id: string;
  asset_class: string;
  target_percent: number;
}): Promise<AllocationTarget> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("allocation_targets")
    .upsert({ ...input, updated_at: now }, { onConflict: "user_id,asset_class" })
    .select("*")
    .single();

  if (error) throw error;
  return data as AllocationTarget;
}

export async function deleteAllocationTarget(id: string, userId: string) {
  const { error } = await supabase.from("allocation_targets").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
