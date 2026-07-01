import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TOPICS } from "@/lib/data";
import { CONTROL, Select, TextInput } from "./Field";
import { Icon } from "./Icon";
import { Menu } from "./Menu";
import { Modal } from "./Modal";
import { SegmentedControl } from "./SegmentedControl";
import { useToast } from "./Toast";

const seedImg = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/450`;

/** Twitter-style budgets: tight enough that polls stay scannable. */
const QUESTION_LIMIT = 40;
const CHOICE_LIMIT = 20;

type Choice = { label: string; image: string | null };

/** Pre-fill payload for a seeded composer (e.g. the SEO challenge flow). */
export type PollSeed = {
  question?: string;
  choices?: [Choice, Choice];
  category?: string;
  tags?: string[];
};

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

/** Twitter-style budget ring: fills as you type and blushes toward danger
 *  near the limit; the last 10 characters count down beside it, and the
 *  whole thing shakes when a keystroke lands on a spent budget. */
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
      {remaining <= 10 && (
        <span
          className="font-sans text-xs font-semibold leading-4 tabular-nums"
          style={{ color }}
        >
          {remaining}
        </span>
      )}
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

/** "Ask the world" — compose a poll: category, the question, two image
 *  choices, tags. Visibility + schedule live behind the Options context
 *  menu in the footer. Mock-posts with a toast. */
export function NewPollModal({
  open,
  onClose,
  seed,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the composer (e.g. challenge a winning option). */
  seed?: PollSeed;
  /** Replaces the default publish when provided (e.g. gate behind auth). */
  onSubmit?: () => void;
  /** Overrides the Post button label. */
  submitLabel?: string;
}) {
  const toast = useToast();
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<[Choice, Choice]>(EMPTY_CHOICES);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [visibility, setVisibility] = useState<"public" | "link">("public");
  const questionShake = useLimitShake(question, QUESTION_LIMIT);

  // Seeded opens (the SEO challenge flow) pre-fill the composer each time the
  // dialog transitions open. Unseeded opens (the global "Ask the world"
  // button) leave state untouched — existing behavior is preserved.
  useEffect(() => {
    if (open && seed) {
      setQuestion(seed.question ?? "");
      setChoices(seed.choices ?? EMPTY_CHOICES);
      setCategory(seed.category ?? "");
      setTags(seed.tags ?? []);
    }
  }, [open, seed]);

  const canPost =
    question.trim() !== "" && choices.every((c) => c.label.trim() !== "");

  const reset = () => {
    setCategory("");
    setQuestion("");
    setChoices(EMPTY_CHOICES);
    setTags([]);
    setTagDraft("");
    setVisibility("public");
  };

  const post = () => {
    toast("Poll published");
    onClose();
    reset();
  };

  const setChoice = (i: 0 | 1, patch: Partial<Choice>) =>
    setChoices((cur) => {
      const next: [Choice, Choice] = [{ ...cur[0] }, { ...cur[1] }];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags((cur) => [...cur, tag]);
    }
    setTagDraft("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="New poll"
      title="New Poll"
      sheetOnMobile
      className="lg:max-w-lg"
      footer={
        <div className="flex items-center justify-between px-4 py-3">
          {/* Options opens a context menu; the hover circle floats behind
              the icon without adding to the button's footprint. */}
          <Menu
            label="Poll options"
            side="top"
            align="start"
            closeOnClick={false}
            className="w-80 p-3"
            trigger={({ open: menuOpen, toggle }) => (
              <button
                onClick={toggle}
                aria-expanded={menuOpen}
                className="group flex h-10 items-center gap-2 font-display text-sm font-bold leading-5 text-text-primary"
              >
                <span className="relative grid h-5 w-5 place-items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-pill transition-colors",
                      menuOpen
                        ? "bg-surface-strong"
                        : "group-hover:bg-surface-subtle",
                    )}
                  />
                  <Icon name="tune" size={20} className="relative" />
                </span>
                Options
              </button>
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-sm font-bold leading-5 text-text-primary">
                  Visibility
                </p>
                <SegmentedControl
                  label="Visibility"
                  value={visibility}
                  onChange={setVisibility}
                  options={[
                    { value: "public", label: "Public", icon: "public" },
                    { value: "link", label: "By Link", icon: "link" },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-sm font-bold leading-5 text-text-primary">
                  Schedule
                </p>
                <div className="flex gap-2">
                  <TextInput
                    type="text"
                    icon="calendar_today"
                    placeholder="Start Date"
                    aria-label="Start date"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                  />
                  <TextInput
                    type="text"
                    icon="event"
                    placeholder="End Date"
                    aria-label="End date"
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                  />
                </div>
              </div>
            </div>
          </Menu>

          <button
            onClick={onSubmit ?? post}
            disabled={!canPost}
            className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitLabel ?? "Post"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-4 py-4">
        {/* A hairline under the question marks it as editable — without it
            the bold placeholder reads as a static heading. */}
        <div className="flex items-end gap-2 border-b border-border-default pb-2 transition-colors focus-within:border-border-accent">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={questionShake.onLimitKeyDown}
            placeholder="Ask a question…"
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
        <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
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

        <Select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={cn(category === "" && "text-text-tertiary")}
        >
          <option value="">Select Category</option>
          {TOPICS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </Select>

        {/* Tags — typed then committed on Enter/comma, up to five. */}
        <div className={cn(CONTROL, "flex h-auto min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5")}>
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
            placeholder={tags.length === 0 ? "Add tags…" : ""}
            aria-label="Add tags"
            className="min-w-24 flex-1 bg-transparent font-sans text-base text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
          />
        </div>
      </div>
    </Modal>
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
          placeholder={`Choice ${index + 1}`}
          aria-label={`Choice ${index + 1} label`}
          maxLength={CHOICE_LIMIT}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-display text-base font-semibold leading-5 text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
        />
        {choice.label.length > 0 && (
          <CharRing value={choice.label} limit={CHOICE_LIMIT} shake={shake} />
        )}
      </div>
      <button
        type="button"
        onClick={onImage}
        aria-label={`Add image for choice ${index + 1}`}
        className="group relative min-h-0 flex-1 overflow-hidden"
      >
        {choice.image ? (
          <img
            src={choice.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-surface-subtle transition-colors group-hover:bg-surface-strong">
            <span className="flex flex-col items-center gap-1 text-text-secondary">
              <Icon name="add_photo_alternate" size={28} />
              <span className="font-sans text-xs font-medium leading-4">
                Add image
              </span>
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
