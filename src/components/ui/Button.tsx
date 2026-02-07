import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth, className = "", ...props }: Props) {
  const variantClass: Record<Variant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger"
  };

  return (
    <button
      {...props}
      className={`btn ${variantClass[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    />
  );
}
