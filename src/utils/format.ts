export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function toNumber(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : fallback;
  return Number.isFinite(n) ? n : fallback;
}
