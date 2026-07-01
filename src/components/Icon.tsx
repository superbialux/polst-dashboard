import { cn } from "@/lib/utils";

type Props = {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: 300 | 400 | 500 | 600 | 700;
  size?: number;
};

export function Icon({
  name,
  className,
  filled = false,
  weight = 400,
  size,
}: Props) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined select-none leading-none", className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        fontSize: size ? `${size}px` : undefined,
      }}
    >
      {name}
    </span>
  );
}
