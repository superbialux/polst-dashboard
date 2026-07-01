import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { NewPollModal, type PollSeed } from "@/components/NewPollModal";
import { useToast } from "@/components/Toast";
import type { PollOption } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** The five SEO-page design directions, in display order. The `id` is the
 *  route segment (`/seo/:variant/:slug`); `n` is the human-facing number. */
export const SEO_VARIANTS = [
  { id: "editorial", n: 1, name: "Editorial Verdict", blurb: "A magazine ruling" },
  { id: "dashboard", n: 2, name: "Standings Board", blurb: "Leaderboard-first" },
  { id: "showdown", n: 3, name: "Showdown", blurb: "Bracket, this-or-that" },
  { id: "minimal", n: 4, name: "Quiet Focus", blurb: "Minimal, one thing at a time" },
  { id: "social", n: 5, name: "Social Thread", blurb: "Threads-native" },
] as const;

export type SeoVariantId = (typeof SEO_VARIANTS)[number]["id"];

export const DEFAULT_SEO_SLUG = "best-burger-in-chicago";

/**
 * Slim, neutral preview bar pinned to the top of every variation so the
 * reviewer can flip between the five designs on the same slug. It is a
 * comparison tool, not part of any variation's design — kept deliberately
 * quiet so it never competes with the page it sits above.
 */
export function VariationSwitcher() {
  const { slug = DEFAULT_SEO_SLUG } = useParams();
  return (
    <nav
      aria-label="SEO page design variations"
      className="mb-4 flex flex-wrap items-center gap-1.5 rounded-card border border-border-default bg-card-bg px-2 py-2 shadow-sm lg:mb-5"
    >
      <span className="px-1.5 font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-tertiary">
        Variation
      </span>
      {SEO_VARIANTS.map((v) => (
        <NavLink
          key={v.id}
          to={`/seo/${v.id}/${slug}`}
          title={v.blurb}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-display text-sm font-bold leading-5 transition-colors",
              isActive
                ? "bg-accent-default text-text-on-accent"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
            )
          }
        >
          <span className="tabular-nums opacity-70">{v.n}</span>
          <span className="hidden sm:inline">{v.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * The "challenge the winner" growth loop, shared by all five variations so the
 * create + auth-gate behavior is identical everywhere. A variation calls
 * `challenge(championOption)` from its CTA, then spreads `modal` onto a
 * `<NewPollModal>`.
 */
export function useChallengeFlow() {
  const { signedIn } = useSession();
  const { openAuth } = useUI();
  const toast = useToast();
  const [champion, setChampion] = useState<PollOption | null>(null);

  const submit = () => {
    setChampion(null);
    if (!signedIn) openAuth("signup");
    else toast("Poll published");
  };

  const seed: PollSeed | undefined = champion
    ? {
        question: `Better than ${champion.label}?`,
        choices: [
          { label: champion.label, image: champion.image },
          { label: "", image: null },
        ],
        category: "Food",
        tags: ["chicago", "burgers"],
      }
    : undefined;

  return {
    /** Open the seeded composer to challenge a winning option. */
    challenge: (option: PollOption) => setChampion(option),
    /** Spread onto a <NewPollModal>. */
    modal: {
      open: champion !== null,
      onClose: () => setChampion(null),
      onSubmit: submit,
      submitLabel: signedIn ? "Post" : "Sign up to publish",
      seed,
    },
  };
}

/** Convenience re-export so variations import the modal from one place. */
export { NewPollModal };
