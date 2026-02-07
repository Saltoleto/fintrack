export function embedName(v: any): string | null {
  if (!v) return null;
  // PostgREST can return either an object or an array depending on relationship config.
  if (Array.isArray(v)) {
    const first = v[0];
    return first?.name ?? null;
  }
  return v?.name ?? null;
}
