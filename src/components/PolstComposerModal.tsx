import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { PollCard } from "@/components/PollCard";
import { Field, FieldHelper, SelectMenu, TextInput } from "@/components/Field";
import { DurationField, ReviewModal, durationEnd, durationPresetFor, type DurationPreset } from "@/components/dashboard";
import { TODAY, fmtDate, fmtDateRange, relativeToToday } from "@/lib/canon";
import { WORKSPACE, polstImage, polstOptions, type Category, type SinglePolst } from "@/lib/workspace";
import { publishedStatus, useWorkspace } from "@/lib/store";

/* ══════════════════════════════════════════════════════════════════
   POLST COMPOSER MODAL — the sibling product's composer, brand-fitted.
   WYSIWYG: the question and the choice pair ARE the poll card voters
   get (Inter Tight, the poll's display face), with Twitter-style
   character budgets. Brand fields ride below: category and schedule.
   As a modal it composes anywhere — especially on a campaign, where
   polsts stack up without ever leaving the screen.
   ══════════════════════════════════════════════════════════════════ */

const QUESTION_LIMIT = 70;
const CHOICE_LIMIT = 40;

const CATEGORIES: Category[] = ["Food & drink", "Lifestyle", "Shopping & deals"];

type Choice = { label: string; image: string | null };
const EMPTY_CHOICES: [Choice, Choice] = [
  { label: "", image: null },
  { label: "", image: null },
];

/** Shake counter + a keydown handler for re-shaking on blocked keystrokes
 *  (maxLength swallows them, so the value alone can't retrigger). */
function useLimitShake(value: string, limit: number) {
  const [shake, setShake] = useState(0);
  const prevLen = useRef(value.length);
  useEffect(() => {
    if (value.length >= limit && prevLen.current < limit) setShake((s) => s + 1);
    prevLen.current = value.length;
  }, [value, limit]);
  const onLimitKeyDown = (e: React.KeyboardEvent) => {
    if (value.length >= limit && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      setShake((s) => s + 1);
    }
  };
  return { shake, onLimitKeyDown };
}

/** Twitter-style budget ring: fills as you type, blushes toward danger
 *  over the last 30%, counts down the final 10 characters, and shakes
 *  when a keystroke lands on a spent budget. */
function CharRing({
  value,
  limit,
  shake,
  className,
}: {
  value: string;
  limit: number;
  shake: number;
  className?: string;
}) {
  const remaining = limit - value.length;
  const fill = Math.min(1, value.length / limit);
  const mix = fill <= 0.7 ? 0 : Math.round(((fill - 0.7) / 0.3) * 100);
  const color = `color-mix(in srgb, var(--accent-default), var(--status-danger) ${mix}%)`;
  const R = 7;
  const C = 2 * Math.PI * R;
  return (
    <span
      key={shake} // remounting replays the shake
      aria-hidden
      className={cn("flex shrink-0 items-center gap-1", shake > 0 && remaining === 0 && "char-shake", className)}
    >
      {remaining <= 10 ? (
        <span className="font-sans text-xs font-semibold leading-4 tabular-nums" style={{ color }}>
          {remaining}
        </span>
      ) : null}
      <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90">
        <circle cx="9" cy="9" r={R} fill="none" strokeWidth="2" className="stroke-border-default" />
        <circle
          cx="9"
          cy="9"
          r={R}
          fill="none"
          strokeWidth="2"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fill)}
          className="transition-[stroke-dashoffset,stroke] duration-150"
        />
      </svg>
    </span>
  );
}

/** One half of the choice pair: a label plate (its own budget) over an
 *  image area that mock-attaches house imagery on click. */
function ChoiceTile({
  index,
  choice,
  onLabel,
  onImage,
}: {
  index: 0 | 1;
  choice: Choice;
  onLabel: (label: string) => void;
  onImage: () => void;
}) {
  const { shake, onLimitKeyDown } = useLimitShake(choice.label, CHOICE_LIMIT);
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-surface-subtle">
      <div className="flex items-center gap-1 pr-2">
        <input
          value={choice.label}
          onChange={(e) => onLabel(e.target.value)}
          onKeyDown={onLimitKeyDown}
          placeholder={`Option ${index === 0 ? "A" : "B"}`}
          aria-label={`Option ${index === 0 ? "A" : "B"} label`}
          maxLength={CHOICE_LIMIT}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-poll text-base font-semibold leading-5 text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
        />
        {choice.label.length > 0 ? (
          <CharRing value={choice.label} limit={CHOICE_LIMIT} shake={shake} />
        ) : null}
      </div>
      <button
        type="button"
        onClick={onImage}
        aria-label={`Add image for option ${index === 0 ? "A" : "B"}`}
        className="group relative min-h-0 flex-1 overflow-hidden"
      >
        {choice.image ? (
          <img src={choice.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-surface-subtle transition-colors group-hover:bg-surface-strong">
            <span className="flex flex-col items-center gap-1 text-text-secondary">
              <Icon name="add_photo_alternate" size={28} />
              <span className="font-sans text-xs font-medium leading-4">Add image</span>
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

/* ── The modal ───────────────────────────────────────────────────── */

export function PolstComposerModal({
  open,
  onClose,
  draft,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  /** Standalone mode: edit this draft instead of creating. */
  draft?: SinglePolst;
  /** Campaign mode: stage the question on this campaign's chain instead
   *  of minting a standalone polst — no category, no schedule. */
  campaign?: { id: string; name: string };
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { createPolst, updatePolst, publishPolst, addQuestionToCampaign } = useWorkspace();

  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<[Choice, Choice]>(EMPTY_CHOICES);
  const [category, setCategory] = useState<string>("");
  const [startDate, setStartDate] = useState(TODAY);
  const [duration, setDuration] = useState<DurationPreset>("7 days");
  const [customEnd, setCustomEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const questionShake = useLimitShake(question, QUESTION_LIMIT);

  // Each open re-seeds from the draft (edit) or resets (create).
  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    setReviewOpen(false);
    setQuestion(draft?.question ?? "");
    setChoices(
      draft
        ? [
            { label: draft.optionA, image: polstImage(draft.id, "a") },
            { label: draft.optionB, image: polstImage(draft.id, "b") },
          ]
        : EMPTY_CHOICES,
    );
    setCategory(draft?.category ?? "");
    setStartDate(draft?.startAt ?? TODAY);
    setDuration(draft ? durationPresetFor(draft.startAt, draft.endAt) : "7 days");
    setCustomEnd(draft?.endAt ?? "");
  }, [open, draft]);

  const setChoice = (i: 0 | 1, patch: Partial<Choice>) =>
    setChoices((cur) => {
      const next: [Choice, Choice] = [{ ...cur[0] }, { ...cur[1] }];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  const endDate = durationEnd(duration, startDate, customEnd);
  // Only a Custom duration can invert the range — refuse it at the source.
  const endBeforeStart = Boolean(endDate && startDate && endDate < startDate);
  const optionsSet = choices.every((c) => c.label.trim() !== "");
  const canSave = question.trim() !== "" && optionsSet && !endBeforeStart;
  // A category is required to publish (staging's rule), never to draft.
  const canPublish = canSave && category !== "";

  const input = () => ({
    question: question.trim(),
    optionA: choices[0].label.trim(),
    optionB: choices[1].label.trim(),
    startAt: startDate || undefined,
    endAt: endDate,
    category: CATEGORIES.find((c) => c === category),
  });

  const addToCampaign = () => {
    if (submitting || !campaign) return;
    setSubmitting(true);
    addQuestionToCampaign(campaign.id, {
      question: question.trim(),
      optionA: choices[0].label.trim(),
      optionB: choices[1].label.trim(),
    });
    toast("Polst added to the chain");
    onClose();
  };

  const saveDraft = () => {
    if (submitting) return; // a double-click must not mint a duplicate draft
    setSubmitting(true);
    let id: string;
    if (draft) {
      updatePolst(draft.id, input());
      id = draft.id;
    } else {
      id = createPolst(input());
    }
    toast("Draft saved");
    onClose();
    navigate(`/polsts/${id}`);
  };

  const publish = () => {
    if (submitting) return;
    setReviewOpen(false);
    const data = input();
    let id: string;
    if (draft) {
      updatePolst(draft.id, data);
      const result = publishPolst(draft.id);
      if (!result.ok) {
        toast(result.reason);
        return;
      }
      id = draft.id;
    } else {
      id = createPolst(data, { publish: true });
    }
    setSubmitting(true);
    // Speak the resolved status, never the intent: past dates land as Ended.
    const resolved = publishedStatus(data.startAt, data.endAt);
    toast(
      resolved === "Scheduled"
        ? `Polst scheduled — starts ${fmtDate(data.startAt!)}`
        : resolved === "Ended"
          ? "Polst published — its dates are already past, so it's Ended"
          : "Polst published — it's live",
    );
    onClose();
    navigate(`/polsts/${id}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={campaign ? `New polst for ${campaign.name}` : draft ? "Edit polst" : "New polst"}
      title={campaign ? "New polst" : draft ? "Edit polst" : "New polst"}
      sheetOnMobile
      className="lg:max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {campaign ? (
            <Button disabled={!question.trim() || !optionsSet || submitting} onClick={addToCampaign}>
              Add to campaign
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" disabled={!canSave || submitting} onClick={saveDraft}>
                Save draft
              </Button>
              {/* Publishing always passes through the review (the audit's
                  required workflow) — never a one-click publish. */}
              <Button disabled={!canPublish || submitting} onClick={() => setReviewOpen(true)}>
                Review & publish
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-4 py-4">
        {/* WYSIWYG: this IS the poll card. A hairline under the question
            marks it editable — bold placeholder reads as a heading. */}
        <div className="flex items-end gap-2 border-b border-border-default pb-2 transition-colors focus-within:border-border-accent">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={questionShake.onLimitKeyDown}
            placeholder="What should people vote on?"
            aria-label="Question (required)"
            maxLength={QUESTION_LIMIT}
            className="min-w-0 flex-1 bg-transparent font-poll text-lg font-bold leading-[26px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <CharRing
            value={question}
            limit={QUESTION_LIMIT}
            shake={questionShake.shake}
            className="pb-1"
          />
        </div>

        {/* The choice pair previews exactly like the voter card: two
            tiles split by the OR disc. */}
        <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
          {([0, 1] as const).map((i) => (
            <ChoiceTile
              key={i}
              index={i}
              choice={choices[i]}
              onLabel={(label) => setChoice(i, { label })}
              onImage={() =>
                setChoice(i, {
                  image: polstImage(choices[i].label.trim() || `choice-${i + 1}`, i === 0 ? "a" : "b"),
                })
              }
            />
          ))}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
            <span className="absolute inset-0 grid place-items-center font-poll text-lg font-bold leading-none text-text-primary">
              OR
            </span>
          </div>
        </div>

        {/* Brand fields — a chain question needs neither. */}
        {campaign ? null : (
          <>
            <Field label="Category" required>
              {(id) => (
                <SelectMenu
                  id={id}
                  label="Category"
                  placeholder="Select category"
                  value={category}
                  onValueChange={setCategory}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
            <Field label="Start date">
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              )}
            </Field>
            <DurationField
              value={duration}
              onChange={setDuration}
              customEnd={customEnd}
              onCustomEndChange={setCustomEnd}
              startAt={startDate}
              subject="polst"
            />
            {endBeforeStart ? (
              <FieldHelper tone="danger">The end date is before the start.</FieldHelper>
            ) : null}
          </>
        )}
      </div>

      {/* The pre-publish review: the exact card voters will see, the
          schedule it runs on, and the lock warning — confirmed. */}
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        label="Review and publish polst"
        title="Review before publishing"
        className="lg:max-w-xl"
        facts={[
          ["Category", category || "—"],
          ["Runs", fmtDateRange(startDate || undefined, endDate)],
          [
            "Goes live",
            !startDate || startDate <= TODAY
              ? endDate && endDate < TODAY
                ? "Dates are already past — it will land as Ended"
                : "Immediately after you confirm"
              : `${fmtDate(startDate)} (${relativeToToday(startDate)})`,
          ],
        ]}
        lockText="The question, both options, and their images lock when you publish. You can end the run early, but you can't edit it."
        confirmLabel="Confirm & publish"
        confirmDisabled={submitting}
        onConfirm={publish}
      >
        <PollCard
          preview
          author={WORKSPACE.brand}
          authorBadge={WORKSPACE.initials}
          authorColor="var(--color-purple-tint)"
          isFollowing
          categories={category ? [category] : []}
          question={question}
          options={polstOptions({
            id: draft?.id ?? (question || "new-polst"),
            optionA: choices[0].label,
            optionB: choices[1].label,
            splitA: 50,
            votes: 0,
          })}
          tags={[]}
          likes={0}
          reposts={0}
          votes={0}
        />
      </ReviewModal>
    </Modal>
  );
}
