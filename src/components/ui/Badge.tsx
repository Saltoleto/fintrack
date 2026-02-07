type Variant = "neutral" | "success" | "warning" | "danger";

export function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: Variant }) {
  const cls: Record<Variant, string> = {
    neutral: "bg-surface border-border text-muted",
    success: "bg-success/15 border-success/25 text-success",
    warning: "bg-warning/15 border-warning/25 text-warning",
    danger: "bg-danger/15 border-danger/25 text-danger"
  };

  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${cls[variant]}`}>{children}</span>
  );
}
