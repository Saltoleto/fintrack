export type ErrorContext =
  | "allocation.save"
  | "allocation.delete"
  | "goal.save"
  | "investment.save"
  | "auth"
  | string;

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;

  if (e && typeof e === "object") {
    const anyE = e as any;
    // Supabase/PostgREST often returns { message, details, hint, code }
    if (typeof anyE.message === "string" && anyE.message.trim()) return anyE.message;
    if (typeof anyE.details === "string" && anyE.details.trim()) return anyE.details;

    try {
      const s = JSON.stringify(e);
      return s !== "{}" ? s : "Erro desconhecido";
    } catch {
      return "Erro desconhecido";
    }
  }

  return "Erro desconhecido";
}

export function toUserFriendlyError(e: unknown, context?: ErrorContext): string {
  const raw = getErrorMessage(e);
  const r = raw.toLowerCase();

  // Concentração por classe: soma > 100%
  if (context === "allocation.save" || context === "allocation.delete" || context?.startsWith("allocation")) {
    if (r.includes("100") || r.includes("exceed") || r.includes("ultrapass") || r.includes("excede")) {
      return "A soma das concentrações ultrapassa 100%. Ajuste os percentuais para que o total seja exatamente 100%.";
    }
  }

  // RLS / permissão
  if (r.includes("row-level security") || r.includes("violates row-level security")) {
    return "Você não tem permissão para executar esta ação. Faça login novamente e tente de novo.";
  }

  // Schema cache / RPC
  if (r.includes("schema cache") && r.includes("function")) {
    return "O Supabase ainda não atualizou o cache do schema. Aguarde alguns segundos, recarregue a página e tente novamente.";
  }

  // Fallback: nunca retornar mensagem vazia
  return raw || "Erro desconhecido";
}
