import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-blue-700",
  secondary: "bg-[var(--muted)] text-[var(--foreground)] hover:bg-zinc-200",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
  danger: "bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});

export type ButtonLinkProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    { className, variant = "primary", size = "md", children, ...rest },
    ref,
  ) {
    return (
      <a
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {children}
      </a>
    );
  },
);
