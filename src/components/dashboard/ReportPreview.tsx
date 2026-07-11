/* ── ReportPreview — the one decision-report dialog ────────────────────
   One report object, one anatomy. Campaign detail's "Export report" and
   Analytics → Reports "Preview" both render this: a DecisionBrief-style
   summary, the voter journey, the source table, and a real Copy summary.
   Every number derives from the entity (sources arrive live from the
   store via the caller); the copy button writes the real clipboard and
   reports failure honestly. */

import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { fmtDateRange, fmtInt, fmtPct, pct } from "@/lib/canon";
import {
  decisionEyebrow,
  headlineLabel,
  polstOptions,
  verdictLabel,
  type Campaign,
  type SinglePolst,
  type Source,
} from "@/lib/workspace";
import { DetailList, Funnel, PollResults, type FunnelStep } from "./kit";

const campaignSummary = (c: Campaign, sources: Source[]): string => {
  const topSource = [...sources].sort((a, b) => b.voters - a.voters)[0];
  return [
    `${c.name} — decision report`,
    ...(c.decision ? [c.decision] : []),
    // A run that ended without a single voter has no verdict to state.
    `Result: ${c.voters === 0 ? "Ended without votes" : verdictLabel(c)}${c.confidence !== "—" ? ` · ${c.confidence} confidence` : ""}`,
    `Voters: ${fmtInt(c.voters)}${c.target ? ` of ${fmtInt(c.target)} target` : ""} · Completion: ${pct(c.completed, c.voters)}`,
    ...(topSource && topSource.voters > 0 ? [`Top source: ${topSource.name}`] : []),
    ...(c.findings.length ? ["", "Findings:", ...c.findings.map((f) => `- ${f}`)] : []),
    ...(c.caveats.length ? ["", "Caveats:", ...c.caveats.map((x) => `- ${x}`)] : []),
    ...(c.nextStep ? ["", `Next step: ${c.nextStep}`] : []),
  ].join("\n");
};

const polstSummary = (p: SinglePolst): string =>
  [
    `${p.question} — ${p.optionA} ${p.splitA}% / ${p.optionB} ${100 - p.splitA}%`,
    `Views: ${fmtInt(p.views)} · Votes: ${fmtInt(p.votes)} · Interactions: ${fmtInt(p.interactions)}`,
    `Ran: ${fmtDateRange(p.startAt, p.endAt)}`,
  ].join("\n");

function SectionTitle({ children }: { children: string }) {
  return <h4 className="font-display text-sm font-semibold text-text-secondary">{children}</h4>;
}

function CampaignReport({ campaign, sources }: { campaign: Campaign; sources: Source[] }) {
  const topSource = [...sources].sort((a, b) => b.voters - a.voters)[0];
  // A run can honestly reach its report with zero voters (published with
  // already-past dates). Its report says so plainly — never a bare "—"
  // verdict over an all-zero funnel.
  const zeroVoters = campaign.voters === 0;
  /* The shared status-aware eyebrow (workspace.decisionEyebrow) — the exact
     words the DecisionBrief speaks, so the report can never open with the
     raw lead label directly above the headline that already carries it. */
  const eyebrow = zeroVoters
    ? { label: "Ended without votes", ready: false }
    : decisionEyebrow(campaign);
  const journey: FunnelStep[] = [
    { label: "Started", count: campaign.voters },
    ...campaign.chain.map((q, i) => ({
      label: `Q${i + 1}: ${q.question}`,
      count: campaign.votesByQuestion[i] ?? 0,
    })),
    { label: "Completed", count: campaign.completed },
  ];

  return (
    <>
      <header>
        <p
          className={cn(
            "text-sm font-semibold",
            eyebrow.ready ? "text-status-success" : "text-text-primary",
          )}
        >
          {eyebrow.label}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold leading-6 text-text-primary">
          {zeroVoters ? "No result — nothing was collected" : headlineLabel(campaign)}
        </h3>
        {campaign.decision ? (
          <p className="mt-1 text-sm text-text-secondary">{campaign.decision}</p>
        ) : null}
        {campaign.summary ? (
          <p className="mt-2 text-sm leading-6 text-text-secondary">{campaign.summary}</p>
        ) : null}
      </header>
      <DetailList
        items={[
          [
            "Voters",
            campaign.target
              ? `${fmtInt(campaign.voters)} of ${fmtInt(campaign.target)} target`
              : fmtInt(campaign.voters),
          ],
          ["Completion", pct(campaign.completed, campaign.voters)],
          ["Top source", topSource && topSource.voters > 0 ? topSource.name : "—"],
          ["Run dates", fmtDateRange(campaign.startAt, campaign.endAt)],
        ]}
      />
      {/* An all-zero funnel is noise, not a journey — suppressed at zero. */}
      {campaign.chain.length > 0 && !zeroVoters ? (
        <section>
          <SectionTitle>Voter journey</SectionTitle>
          <div className="mt-2">
            <Funnel steps={journey} />
          </div>
        </section>
      ) : null}
      {sources.length > 0 ? (
        <section>
          <SectionTitle>Sources</SectionTitle>
          <ul className="mt-2 divide-y divide-border-default rounded-md border border-border-default">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                  {source.name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                  {fmtInt(source.voters)} voters ·{" "}
                  {source.completionRate !== null ? fmtPct(source.completionRate, 0) : "—"}{" "}
                  completion
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {campaign.findings.length > 0 ? (
        <section>
          <SectionTitle>Key findings</SectionTitle>
          <ul className="mt-2 space-y-2">
            {campaign.findings.map((finding) => (
              <li key={finding} className="flex items-start gap-2.5 text-sm leading-6">
                <Icon
                  name="check_circle"
                  size={20}
                  filled
                  className="mt-0.5 shrink-0 text-status-success"
                />
                <span className="text-text-secondary">{finding}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {campaign.caveats.length > 0 ? (
        <section>
          <SectionTitle>Caveats</SectionTitle>
          <ul className="mt-2 space-y-2">
            {campaign.caveats.map((caveat) => (
              <li key={caveat} className="flex items-start gap-2.5 text-sm leading-6">
                <Icon
                  name="error"
                  size={20}
                  filled
                  className="mt-0.5 shrink-0 text-status-warning"
                />
                <span className="text-text-secondary">{caveat}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {campaign.nextStep ? (
        <p className="text-sm leading-6 text-text-secondary">
          <span className="font-semibold text-text-primary">Next step:</span> {campaign.nextStep}
        </p>
      ) : null}
    </>
  );
}

function PolstReport({ polst }: { polst: SinglePolst }) {
  return (
    <>
      <h3 className="font-display text-lg font-semibold leading-6 text-text-primary">
        {polst.question}
      </h3>
      <PollResults options={polstOptions(polst)} dense className="mx-auto max-w-sm" />
      <DetailList
        items={[
          ["Views", fmtInt(polst.views)],
          ["Votes", fmtInt(polst.votes)],
          ["Votes / view", polst.engagementRate !== null ? fmtPct(polst.engagementRate, 1) : "—"],
          ["Interactions", fmtInt(polst.interactions)],
          ["Run dates", fmtDateRange(polst.startAt, polst.endAt)],
        ]}
      />
    </>
  );
}

export function ReportPreview({
  open,
  onClose,
  title,
  campaign,
  sources = [],
  polst,
}: {
  open: boolean;
  onClose: () => void;
  /** The report deliverable's name; defaults to the object's report kind. */
  title?: string;
  campaign?: Campaign;
  /** The campaign's sources, read live from the store by the caller. */
  sources?: Source[];
  polst?: SinglePolst;
}) {
  const toast = useToast();

  const copySummary = async () => {
    const text = campaign ? campaignSummary(campaign, sources) : polst ? polstSummary(polst) : "";
    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied to clipboard");
    } catch {
      toast("Copy failed — the browser blocked clipboard access");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Report preview"
      title={title ?? (polst ? "Polst report" : "Decision report")}
      className="lg:max-w-2xl"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={() => void copySummary()}>
            <Icon name="content_copy" size={18} />
            Copy summary
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {campaign ? (
          <CampaignReport campaign={campaign} sources={sources} />
        ) : polst ? (
          <PolstReport polst={polst} />
        ) : null}
      </div>
    </Modal>
  );
}
