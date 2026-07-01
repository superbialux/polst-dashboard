/**
 * Accent tones: an icon/text color paired with its matching soft circle tint.
 * Shared by the footer actions (like/repost) and the category-nav active icon
 * so the two stay in sync.
 */
export const TONE = {
  neutral: { text: "text-text-primary", ring: "bg-surface-subtle" },
  red: { text: "text-base-red", ring: "bg-[color:var(--color-red-10)]" },
  green: { text: "text-base-green", ring: "bg-[color:var(--color-green-10)]" },
  violet: {
    text: "text-accent-default",
    ring: "bg-[color:var(--color-brand-purple-10)]",
  },
} as const;

export type Tone = keyof typeof TONE;
