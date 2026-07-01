import { cn } from "@/lib/utils";

type Props = { className?: string };

export function PolstWordmark({ className }: Props) {
  return (
    <img
      src="/polst-wordmark.png"
      alt="Polst"
      draggable={false}
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}

export function PolstSymbol({ className }: Props) {
  return (
    <img
      src="/polst-symbol.png"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("h-7 w-auto object-contain", className)}
    />
  );
}
