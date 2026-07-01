import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { PageShell } from "@/components/PageShell";
import { DEFAULT_SEO_SLUG, SEO_VARIANTS } from "./shared";

/** `/seo` — the chooser. Five takes on the same SEO answer page, all on the
 *  same slug so they can be compared like-for-like. */
export function SeoGallery() {
  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
      <header className="px-0.5 pb-5">
        <p className="font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-accent">
          Pick a direction
        </p>
        <h1 className="mt-0.5 font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
          SEO answer page — five takes
        </h1>
        <p className="mt-1 max-w-prose font-sans text-sm leading-5 text-text-secondary">
          Same question, same data, same design system — five different ways to
          present the world's answer. Open each, then flip between them from the
          bar at the top of any page.
        </p>
      </header>

      <ul className="flex flex-col gap-2.5">
        {SEO_VARIANTS.map((v) => (
          <li key={v.id}>
            <Link
              to={`/seo/${v.id}/${DEFAULT_SEO_SLUG}`}
              className="group flex items-center gap-4 rounded-card border border-border-default bg-card-bg px-4 py-4 shadow-sm transition-colors hover:bg-surface-subtle"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-accent-soft font-display text-lg font-bold text-text-accent tabular-nums">
                {v.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-bold leading-5 text-text-primary">
                  {v.name}
                </span>
                <span className="mt-0.5 block font-sans text-sm leading-5 text-text-secondary">
                  {v.blurb}
                </span>
              </span>
              <Icon
                name="arrow_forward"
                size={20}
                className="shrink-0 text-icon-tertiary transition-colors group-hover:text-text-accent"
              />
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
