import { useState } from "react";
import { Link } from "react-router-dom";
import { Drawer } from "@/components/Drawer";
import { Icon } from "@/components/Icon";
import { IconButton } from "@/components/ui/icon-button";
import { METRIC_INFO } from "@/lib/canon";

/* ══════════════════════════════════════════════════════════════════
   HELP GUIDE — the teaching layer.
   The transcript's ask: a side tab that explains the product's model
   in place, plus a worked example to learn from. Everything here
   restates the app's real contracts (canon definitions, the lock
   rules, the fixed durations) — no new claims, no marketing voice.
   The worked example is the seeded ended campaign, so the numbers in
   the story are the numbers in the report.
   ══════════════════════════════════════════════════════════════════ */

const METRIC_ROWS: Array<{ term: string; def: string }> = [
  { term: "Views", def: METRIC_INFO.views },
  { term: "Votes", def: METRIC_INFO.votes },
  { term: "Voters", def: METRIC_INFO.voters },
  { term: "Completion rate", def: METRIC_INFO.completionRate },
  { term: "Engagement rate", def: METRIC_INFO.engagementRate },
  { term: "Interactions", def: METRIC_INFO.interactions },
  { term: "Confidence", def: METRIC_INFO.confidence },
];

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="px-5 pt-5">
      <h3 className="font-display text-sm font-semibold text-text-primary">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-text-secondary">{children}</div>
    </section>
  );
}

export function HelpGuide() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton aria-label="How Polst works" onClick={() => setOpen(true)}>
        <Icon name="help" size={20} />
      </IconButton>
      <Drawer open={open} onClose={() => setOpen(false)} side="right" title="How Polst works">
        <GuideSection title="How a decision is made">
          <p>
            Every campaign names one decision question. Its leading option is the campaign's
            result, spoken as a percentage-point lead — "Citrus Mint · 12 percentage-point
            lead" means 56 / 44. The other questions add context; they never overrule the
            decision question.
          </p>
        </GuideSection>
        <GuideSection title="What confidence means">
          <p>
            {METRIC_INFO.confidence} Hover any ⓘ in the app to see how the number under it is
            computed.
          </p>
        </GuideSection>
        <GuideSection title="The metrics, in plain words">
          <dl className="space-y-2.5">
            {METRIC_ROWS.map((row) => (
              <div key={row.term}>
                <dt className="font-medium text-text-primary">{row.term}</dt>
                <dd className="leading-5">{row.def}</dd>
              </div>
            ))}
          </dl>
        </GuideSection>
        <GuideSection title="The rules that protect your evidence">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Questions and options lock when a run goes live — mid-run edits would make the early votes and the late votes answers to different questions.</li>
            <li>A run that has collected votes can't be unpublished or deleted; it ends, and the record stays.</li>
            <li>Runs last 3, 7, or 10 days. A fixed window keeps every result comparable to the last one.</li>
            <li>Publishing always passes through a review step that shows exactly what voters will see.</li>
          </ul>
        </GuideSection>
        <GuideSection title="A worked example">
          <p>
            Flavor Launch Recap ran its four questions to 1,184 voters, passed its 1,000-voter
            target, and Citrus Mint held a 12 percentage-point lead on the decision question —
            so its report recommends Citrus Mint at high confidence.{" "}
            <Link
              to="/campaigns/flavor-launch-recap"
              onClick={() => setOpen(false)}
              className="font-semibold text-text-accent hover:underline"
            >
              Open the campaign
            </Link>{" "}
            and read the report against the numbers above.
          </p>
        </GuideSection>
        <div className="px-5 py-5 text-xs leading-5 text-text-tertiary">
          Definitions live on every metric as ⓘ hovers, so you never have to come back here to
          check one.
        </div>
      </Drawer>
    </>
  );
}
