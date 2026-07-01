import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";

/** Compact ancestry trail above page titles (SEO + discovery pages). */
export function Breadcrumbs({
  items,
}: {
  items: { label: string; to: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="pb-1.5">
      <ol className="flex flex-wrap items-center gap-1 font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
        {items.map((item, i) => (
          <Fragment key={item.to + item.label}>
            {i > 0 && (
              <li aria-hidden className="flex">
                <Icon
                  name="chevron_right"
                  size={14}
                  className="text-icon-tertiary"
                />
              </li>
            )}
            <li>
              <Link
                to={item.to}
                className="rounded-sm font-medium text-text-accent transition-colors hover:underline"
              >
                {item.label}
              </Link>
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
