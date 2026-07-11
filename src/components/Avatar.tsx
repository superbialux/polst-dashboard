import { cn } from "@/lib/utils";

type AvatarProps = {
  /** Any CSS color, incl. token vars e.g. "var(--avatar-bg-success)". */
  color?: string;
  /** Initials ("MP") or short badge label ("Future"). */
  label?: string;
  /** Photo URL — when set, renders the image instead of the label. */
  image?: string;
  variant?: "monogram" | "badge";
  /** Diameter in px. */
  size?: number;
  /** Label color (any CSS color). Defaults to inverse (white). */
  textColor?: string;
  className?: string;
  /** Fallback content when there's no image or label (e.g. a glyph). */
  children?: React.ReactNode;
};

/** Round avatar placeholder shared by the header and poll cards. */
export function Avatar({
  color,
  label,
  image,
  variant = "monogram",
  size = 36,
  textColor,
  className,
  children,
}: AvatarProps) {
  return (
    // Size lives in a CSS var consumed by h/w classes, so call sites can
    // override it responsively (e.g. lg:h-10 lg:w-10) — an inline width
    // style would always win over classes.
    <div
      aria-hidden
      className={cn(
        "grid h-[var(--avatar-size)] w-[var(--avatar-size)] shrink-0 place-items-center overflow-hidden rounded-pill",
        className,
      )}
      style={
        {
          "--avatar-size": `${size}px`,
          ...(color && !image ? { backgroundColor: color } : {}),
        } as React.CSSProperties
      }
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : label ? (
        <span
          className={cn(
            "font-display font-semibold uppercase leading-none tracking-tight",
            !textColor && "text-text-inverse",
            variant === "monogram" ? "text-sm" : "text-[9px] lg:text-[10px]",
          )}
          style={textColor ? { color: textColor } : undefined}
        >
          {label}
        </span>
      ) : (
        children
      )}
    </div>
  );
}
