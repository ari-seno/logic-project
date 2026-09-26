export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

export const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  warning:
    "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  danger:
    "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  info: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  neutral:
    "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
  brand: "bg-[var(--brand-soft)] text-[var(--brand)] ring-[var(--brand)]/25",
};

export const TONE_SURFACE_CLASSES: Record<StatusTone, string> = {
  success: "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-fg)]",
  warning: "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  danger: "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  info: "border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-fg)]",
  neutral: "border-[var(--neutral-border)] bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
  brand: "border-[var(--brand)]/30 bg-[var(--brand-soft)] text-[var(--brand)]",
};

export function toneClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}

export function toneSurfaceClasses(tone: StatusTone): string {
  return TONE_SURFACE_CLASSES[tone];
}
