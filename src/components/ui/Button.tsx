import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth, className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium " +
    "transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-onPrimary hover:bg-primary/90",
    secondary: "bg-surface text-fg border border-border hover:bg-surface/70",
    ghost: "bg-transparent text-fg hover:bg-surface/60 border border-transparent",
    danger: "bg-danger text-onDanger hover:bg-danger/90"
  };

  return (
    <button className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`} {...props} />
  );
}
