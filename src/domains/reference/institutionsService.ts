import { supabase } from "@/services/supabase";

export type Institution = {
  id: string;
  name: string;
  type: string | null;
};

export async function listInstitutions(): Promise<Institution[]> {
  const { data, error } = await supabase
    .from("institutions")
    .select("id,name,type")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Institution[];
}
