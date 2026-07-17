import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom font-size token; otherwise it treats
// `text-micro` as a text-*color* and drops it when a real color class follows.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["micro"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Copy to the clipboard, reporting whether it actually worked so callers
 *  can toast honestly. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** True when the OS asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
