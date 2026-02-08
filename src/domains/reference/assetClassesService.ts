import { supabase } from "@/services/supabase";

export type AssetClass = {
  id: string;
  name: string;
  risk_level: string | null;
};

export async function listAssetClasses(): Promise<AssetClass[]> {
  const { data, error } = await supabase
    .from("asset_classes")
    .select("id,name,risk_level")
        .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AssetClass[];
}
