import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { curatedImage } from "@/lib/workspace";
import { CONTROL } from "./Field";
import { Icon } from "./Icon";
import { Menu, MenuItem } from "./Menu";
import { Button } from "./ui/button";

/** The consumer composer's anatomy (ported from the Polst app's "Ask the
 *  world" dialog) as an inline block, so creating a Polst in the dashboard
 *  looks exactly like the card voters will see. Mock-only: images attach a
 *  seeded photo on click. */

const seedImg = (seed: string) => curatedImage(seed, 600, 450);

/** Twitter-style budgets: tight enough that polls stay scannable.
 *  Limits match staging exactly — 70 for the question, 40 per option. */
const QUESTION_LIMIT = 70;
const CHOICE_LIMIT = 40;

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
    if (value.length >= limit && prevLen.current < limit) {
      setShake((s) => s + 1);
    }
    prevLen.current = value.length;
  }, [value, limit]);
  const onLimitKeyDown = (e: React.KeyboardEvent) => {
    if (
      value.length >= limit &&
      e.key.length === 1 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      setShake((s) => s + 1);
    }
  };
  return { shake, onLimitKeyDown };
}

/** Twitter-style budget ring with a live counter: the "12/70" count is
 *  always visible (real feedback: "character limits are missing"), the
 *  ring fills as you type and blushes toward danger near the limit, and
 *  the whole thing shakes when a keystroke lands on a spent budget. */
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
  // Accent for most of the budget, blending into danger over the last 30%.
  const mix = fill <= 0.7 ? 0 : Math.round(((fill - 0.7) / 0.3) * 100);
  const color = `color-mix(in srgb, var(--accent-default), var(--status-danger) ${mix}%)`;
  const R = 7;
  const C = 2 * Math.PI * R;

  return (
    <span
      // Remounting on each bump replays the shake.
      key={shake}
      aria-hidden
      className={cn(
        "flex shrink-0 items-center gap-1",
        shake > 0 && remaining === 0 && "char-shake",
        className,
      )}
    >
      <span
        className="font-sans text-xs font-medium leading-4 tabular-nums"
        style={mix > 0 ? { color } : undefined}
      >
        <span className={mix > 0 ? undefined : "text-text-tertiary"}>
          {value.length}/{limit}
        </span>
      </span>
      <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] -rotate-90">
        <circle
          cx="9"
          cy="9"
          r={R}
          fill="none"
          strokeWidth="2"
          className="stroke-border-default"
        />
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

/** One half of the choice pair: a label plate (with its own character
 *  budget) on top, an image area below that mocks an upload on click. */
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
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-option-bg">
      <div className="flex items-center gap-1 pr-2">
        <input
          value={choice.label}
          onChange={(e) => onLabel(e.target.value)}
          onKeyDown={onLimitKeyDown}
          placeholder={`Option ${index === 0 ? "A" : "B"} (required)`}
          aria-label={`Option ${index === 0 ? "A" : "B"} label (required)`}
          maxLength={CHOICE_LIMIT}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-display text-base font-semibold leading-5 text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
        />
        <CharRing value={choice.label} limit={CHOICE_LIMIT} shake={shake} />
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
          <span className="grid h-full w-full place-items-center bg-surface-subtle p-2 transition-colors">
            {/* A machined dropzone: inset dashed well that warms on hover,
                with the affordance carried by a raised icon disc. */}
            <span className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border-strong transition-colors group-hover:border-border-accent group-hover:bg-accent-soft">
              <span className="grid h-11 w-11 place-items-center rounded-pill bg-surface-raised text-icon-secondary shadow-sm transition-colors group-hover:text-accent-default">
                <Icon name="add_photo_alternate" size={22} />
              </span>
              <span className="font-sans text-xs font-medium leading-4 text-text-secondary">
                Add image
              </span>
              <span className="font-sans text-xs leading-4 text-text-tertiary">
                PNG or JPG, 4:3 works best
              </span>
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

/** Question + option pair + category + tags — the whole composing surface.
 *  The pair previews exactly like a feed card: two tiles split by the OR
 *  disc. */
export type ComposerState = {
  question: string;
  optionA: string;
  optionB: string;
  /** First selected category — stores persist it as the category. */
  category: string | null;
  optionsSet: boolean;
};

/** Prefill for editing an existing draft. */
export type ComposerInitial = {
  question?: string;
  optionA?: string;
  optionB?: string;
  imageA?: string;
  imageB?: string;
  categories?: string[];
};

export function PollComposer({
  categories,
  initial,
  onChange,
  className,
}: {
  /** Category choices for the select (e.g. workspace categories). */
  categories: string[];
  /** Starting values when editing an existing draft. */
  initial?: ComposerInitial;
  /** Fires on every edit so rails can reflect real readiness. */
  onChange?: (state: ComposerState) => void;
  className?: string;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial?.categories ?? [],
  );
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [choices, setChoices] = useState<[Choice, Choice]>(() =>
    initial
      ? [
          { label: initial.optionA ?? "", image: initial.imageA ?? null },
          { label: initial.optionB ?? "", image: initial.imageB ?? null },
        ]
      : EMPTY_CHOICES,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const questionShake = useLimitShake(question, QUESTION_LIMIT);

  useEffect(() => {
    // Images aren't part of readiness: attaching one here is a mock (the
    // model derives every Polst's imagery through polstImage()), so the
    // composer reports only what the model actually persists.
    onChange?.({
      question: question.trim(),
      optionA: choices[0].label.trim(),
      optionB: choices[1].label.trim(),
      category: selectedCategories[0] ?? null,
      optionsSet: choices.every((c) => c.label.trim() !== ""),
    });
  }, [question, choices, selectedCategories, onChange]);

  const setChoice = (i: 0 | 1, patch: Partial<Choice>) =>
    setChoices((cur) => {
      const next: [Choice, Choice] = [{ ...cur[0] }, { ...cur[1] }];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10 && tag.length <= 40) {
      setTags((cur) => [...cur, tag]);
    }
    setTagDraft("");
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* A hairline under the question marks it as editable — without it
          the bold placeholder reads as a static heading. */}
      <div className="flex items-end gap-2 border-b border-border-default pb-2 transition-colors focus-within:border-border-accent">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={questionShake.onLimitKeyDown}
          placeholder="Ask a question (required)…"
          aria-label="Question (required)"
          maxLength={QUESTION_LIMIT}
          className="min-w-0 flex-1 bg-transparent font-display text-lg font-bold leading-[26px] text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <CharRing
          value={question}
          limit={QUESTION_LIMIT}
          shake={questionShake.shake}
          className="pb-1"
        />
      </div>

      {/* The choice pair previews exactly like a feed card: two tiles
          split by the OR disc. Tapping a tile's image area attaches a
          sample photo (mock upload). */}
      <div className="relative flex h-80 items-stretch justify-center gap-1">
        {([0, 1] as const).map((i) => (
          <ChoiceTile
            key={i}
            index={i}
            choice={choices[i]}
            onLabel={(label) => setChoice(i, { label })}
            onImage={() =>
              setChoice(i, {
                image: seedImg(choices[i].label.trim() || `choice-${i + 1}`),
              })
            }
          />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-12 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
          <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold leading-none text-text-primary">
            OR
          </span>
        </div>
      </div>

      <Menu
        label="Categories"
        // The portaled panel matches the trigger's width by itself.
        rootClassName="w-full"
        trigger={({ open, toggle }) => (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={toggle}
            aria-expanded={open}
            className="h-10 w-full justify-between px-3 font-sans text-sm font-normal"
          >
            <span className={selectedCategories.length ? "truncate" : "truncate text-text-tertiary"}>
              {selectedCategories.length
                ? selectedCategories.join(", ")
                : "Select categories (required)"}
            </span>
            <Icon name="arrow_drop_down" size={18} />
          </Button>
        )}
      >
        {categories.map((name) => (
          <MenuItem
            key={name}
            label={name}
            selected={selectedCategories.includes(name)}
            onClick={() =>
              setSelectedCategories((current) =>
                current.includes(name)
                  ? current.filter((category) => category !== name)
                  : [...current, name],
              )
            }
          />
        ))}
      </Menu>

      {/* Tags — typed then committed on Enter/comma, up to ten. */}
      <div
        className={cn(
          CONTROL,
          "flex h-auto min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5",
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-card-tag-bg px-2 py-1 font-sans text-xs font-medium leading-4 text-text-secondary"
          >
            #{tag}
            <button
              aria-label={`Remove tag ${tag}`}
              onClick={() => setTags((cur) => cur.filter((t) => t !== tag))}
              className="-m-1.5 grid place-items-center p-1.5 text-icon-tertiary hover:text-text-primary"
            >
              <Icon name="close" size={14} />
            </button>
          </span>
        ))}
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Add tags (optional)…" : ""}
          aria-label="Add tags"
          className="min-w-24 flex-1 bg-transparent font-sans text-base text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
        />
      </div>
      <p className="text-xs text-text-tertiary">Up to 10 tags, 40 characters each.</p>
    </div>
  );
}
