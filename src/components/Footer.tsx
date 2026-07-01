import { PAGE_CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { PolstWordmark } from "./PolstLogo";

const COLUMNS = [
  {
    title: "Company",
    items: ["Our Story", "Leadership & Investors", "Careers", "Media & Brand"],
  },
  { title: "Resources", items: ["Blog", "Events", "Knowledge Base"] },
  {
    title: "Legal",
    items: ["Privacy Policy", "Terms of Use", "Cookie Policy", "Contact Us"],
  },
];

/** Site footer for desktop document-style pages (profile, topics,
 *  settings). The feed keeps its compact legal links in the rail instead. */
export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full flex-col border-t border-border-default bg-surface-raised py-10",
        className,
      )}
    >
      <div
        className={cn(
          PAGE_CONTAINER,
          "flex flex-col gap-8 px-2.5 md:flex-row md:items-start md:justify-between md:gap-12 xl:px-0",
        )}
      >
        <div className="flex flex-col items-start gap-2">
          <PolstWordmark className="h-8 dark:invert" />
          <p className="font-display text-base font-medium leading-6 text-text-secondary">
            Ask the world.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p className="font-display text-sm font-bold leading-5 text-text-primary">
                {col.title}
              </p>
              <ul className="flex flex-col gap-2 font-sans text-sm leading-5 text-text-secondary">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="transition-colors hover:text-text-primary hover:underline"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          PAGE_CONTAINER,
          "mt-10 flex items-center justify-between border-t border-border-default px-2.5 pt-6 xl:px-0",
        )}
      >
        <p className="font-sans text-xs leading-4 text-text-secondary">
          © 2026 Polst Inc.
        </p>
        <div className="flex items-center gap-1 text-icon-secondary">
          {SOCIAL.map((s) => (
            <a
              key={s.name}
              href="#"
              aria-label={s.name}
              className="grid h-9 w-9 place-items-center rounded-pill transition-colors hover:bg-surface-subtle hover:text-icon-primary"
            >
              {s.glyph}
            </a>
          ))}
          <a
            href="#"
            aria-label="Email"
            className="grid h-9 w-9 place-items-center rounded-pill transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          >
            <Icon name="mail" size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

/* Brand marks inlined — the icon font has no social logos. */
const SOCIAL = [
  {
    name: "X",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95H15.83c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12Z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 1 1-2.31-2.84V9.39a6.34 6.34 0 1 0 5.76 6.31V8.16a8.16 8.16 0 0 0 4.77 1.52v-3a4.85 4.85 0 0 1-1-.99Z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
      </svg>
    ),
  },
];
