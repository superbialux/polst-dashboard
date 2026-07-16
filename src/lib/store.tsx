/* ── Workspace store — in-session mutations over the seed model ────────
   The dashboard is a mockup with no backend, but flows must actually
   complete: create → add Polsts → publish → assign sources, visibly.
   This context seeds from the static model and applies real state
   transitions in memory. Nothing persists across a reload — by design.
   New objects start with zero traffic, so every derived number stays
   coherent with the invariants in scripts/verify-model.ts. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TODAY, fmtDate, fmtInt, signalFor, type Status } from "@/lib/canon";
import {
  CAMPAIGNS,
  SINGLE_POLSTS,
  SOURCES,
  TEAM,
  WORKSPACE_NOTIFICATIONS,
  clipToRun,
  type Campaign,
  type ChainQuestion,
  type Channel,
  type SinglePolst,
  type Source,
  type TeamMember,
  type WorkspaceNotification,
} from "@/lib/workspace";

/* ── Helpers ──────────────────────────────────────────────────────── */

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "untitled";

const uniqueId = (name: string, taken: Set<string>) => {
  const base = slugify(name);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
};

/** A freshly created campaign: zero traffic, every derived field coherent. */
const blankCampaign = (
  id: string,
  input: CreateCampaignInput,
): Campaign => ({
  id,
  name: input.name.trim(),
  decision: input.decision?.trim() ?? "",
  event: input.event,
  status: "Draft",
  createdAt: TODAY,
  startAt: input.startAt,
  endAt: input.endAt,
  target: input.target,
  category: input.category ?? "Food & drink",
  chain: [],
  decisionIndex: 0,
  voters: 0,
  completed: 0,
  viewsFactor: 2.2,
  shares: 0,
  summary: "",
  nextStep: "",
  findings: [],
  caveats: [],
  sampleNote: "",
  votesByQuestion: [],
  votes: 0,
  views: 0,
  winner: null,
  signal: "Not started",
  confidence: "—",
  completionRate: null,
  sources: [],
});

const blankPolst = (id: string, input: CreatePolstInput): SinglePolst => ({
  id,
  question: input.question.trim(),
  optionA: input.optionA.trim(),
  optionB: input.optionB.trim(),
  splitA: 0,
  status: "Draft",
  createdAt: TODAY,
  startAt: input.startAt,
  endAt: input.endAt,
  event: input.event,
  category: input.category ?? "Food & drink",
  votes: 0,
  viewsFactor: 2.2,
  interactions: 0,
  views: 0,
  engagementRate: null,
  sources: [],
});

/** Publishing resolves from the object's dates: a future start is Scheduled,
 *  a past end is Ended (never a falsely "Active" run), otherwise Active.
 *  Exported so pages can speak the resolved outcome (toasts never claim
 *  "live" for a run the store resolved to Ended). */
export const publishedStatus = (startAt?: string, endAt?: string): Status =>
  endAt && endAt < TODAY ? "Ended" : startAt && startAt > TODAY ? "Scheduled" : "Active";

/** Pure schedule-edit rule for updateCampaign, exported so verify-model can
 *  regression-test it. Two invariants: (1) a run that collected votes never
 *  moves its start — the dates voters arrived under are part of the record —
 *  and (2) any date change on a published run re-resolves the status through
 *  publishedStatus, so an Active run can never claim a future start and a
 *  Scheduled run can never keep "Scheduled" after its start moves into the
 *  past. Drafts and archived runs keep their status: dates on them are plans. */
export const scheduleEdit = (
  c: { status: Status; voters: number; startAt?: string; endAt?: string },
  nextStart?: string,
  nextEnd?: string,
): { ok: true; status: Status } | { ok: false; reason: string } => {
  const published = c.status !== "Draft" && c.status !== "Archived";
  if (published && c.voters > 0 && nextStart !== c.startAt)
    return {
      ok: false as const,
      reason: "This run has collected votes — its start date is part of the record.",
    };
  const datesChanged = nextStart !== c.startAt || nextEnd !== c.endAt;
  return {
    ok: true as const,
    status: published && datesChanged ? publishedStatus(nextStart, nextEnd) : c.status,
  };
};

/* ── Public shape ─────────────────────────────────────────────────── */

export type CreateCampaignInput = {
  name: string;
  decision?: string;
  startAt?: string;
  endAt?: string;
  target?: number;
  event?: string;
  category?: Campaign["category"];
};

export type CreatePolstInput = {
  question: string;
  optionA: string;
  optionB: string;
  startAt?: string;
  endAt?: string;
  event?: string;
  category?: SinglePolst["category"];
};

export type AddSourceInput = {
  name: string;
  kind: Source["kind"];
  channel: Channel;
  placement?: string;
  linked?: Source["linked"];
};

type WorkspaceStore = {
  campaigns: Campaign[];
  polsts: SinglePolst[];
  sources: Source[];
  notifications: WorkspaceNotification[];
  campaignById: (id?: string) => Campaign | undefined;
  polstById: (id?: string) => SinglePolst | undefined;

  createCampaign: (input: CreateCampaignInput) => string;
  /** Refuses start-date edits on voted runs; date changes on published runs
   *  re-resolve the status (scheduleEdit) so the UI can speak the outcome. */
  updateCampaign: (
    id: string,
    patch: Partial<CreateCampaignInput>,
  ) => { ok: true; status: Status } | { ok: false; reason: string };
  addQuestionToCampaign: (campaignId: string, q: { question: string; optionA: string; optionB: string }) => void;
  addLibraryPolstToCampaign: (campaignId: string, polstId: string) => void;
  removeChainQuestion: (campaignId: string, questionId: string) => void;
  reorderChain: (campaignId: string, from: number, to: number) => void;
  publishCampaign: (id: string) => { ok: true; status: Status } | { ok: false; reason: string };
  unpublishCampaign: (id: string) => { ok: true } | { ok: false; reason: string };
  restoreCampaign: (id: string) => Status;
  endCampaign: (id: string) => void;
  archiveCampaign: (id: string) => void;

  createPolst: (input: CreatePolstInput, opts?: { publish?: boolean }) => string;
  updatePolst: (id: string, patch: Partial<CreatePolstInput>) => void;
  publishPolst: (id: string) => { ok: true; status: Status } | { ok: false; reason: string };
  archivePolst: (id: string) => void;
  restorePolst: (id: string) => Status;

  addSource: (input: AddSourceInput) => string;
  assignSource: (sourceId: string, linked: NonNullable<Source["linked"]>) => void;
  /** Refused once the source has voters — attribution is part of the record. */
  unassignSource: (sourceId: string) => { ok: true } | { ok: false; reason: string };

  members: TeamMember[];
  /** Provisions a brand-only Manager account; "joined" fills at first sign-in. */
  addMember: (name: string, email: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;
};

const StoreContext = createContext<WorkspaceStore | null>(null);

/* ── Provider ─────────────────────────────────────────────────────── */

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [polsts, setPolsts] = useState<SinglePolst[]>(SINGLE_POLSTS);
  const [sources, setSources] = useState<Source[]>(SOURCES);
  const [members, setMembers] = useState<TeamMember[]>(TEAM);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(
    WORKSPACE_NOTIFICATIONS,
  );

  const patchCampaign = useCallback(
    (id: string, fn: (c: Campaign) => Campaign) =>
      setCampaigns((all) => all.map((c) => (c.id === id ? fn(c) : c))),
    [],
  );
  const patchPolst = useCallback(
    (id: string, fn: (p: SinglePolst) => SinglePolst) =>
      setPolsts((all) => all.map((p) => (p.id === id ? fn(p) : p))),
    [],
  );

  // Ids are minted synchronously from the rendered state (an updater may run
  // after the caller navigates), and the enqueue re-checks for collisions.
  const createCampaign = useCallback(
    (input: CreateCampaignInput) => {
      const id = uniqueId(input.name, new Set(campaigns.map((c) => c.id)));
      setCampaigns((all) =>
        all.some((c) => c.id === id) ? all : [blankCampaign(id, input), ...all],
      );
      return id;
    },
    [campaigns],
  );

  const createPolst = useCallback(
    (input: CreatePolstInput, opts?: { publish?: boolean }) => {
      const id = uniqueId(input.question, new Set(polsts.map((p) => p.id)));
      setPolsts((all) => {
        if (all.some((p) => p.id === id)) return all;
        const polst = blankPolst(id, input);
        return [
          opts?.publish
            ? { ...polst, status: publishedStatus(polst.startAt, polst.endAt) }
            : polst,
          ...all,
        ];
      });
      return id;
    },
    [polsts],
  );

  // Notifications clip to each run's current end: a schedule edit or an
  // in-session ending that moves a campaign's end earlier retires milestone
  // entries the record now contradicts (workspace.clipToRun).
  const visibleNotifications = useMemo(
    () => clipToRun(notifications, campaigns),
    [notifications, campaigns],
  );

  const value = useMemo<WorkspaceStore>(
    () => ({
      campaigns,
      polsts,
      sources,
      notifications: visibleNotifications,
      campaignById: (id) => campaigns.find((c) => c.id === id),
      polstById: (id) => polsts.find((p) => p.id === id),

      createCampaign,
      updateCampaign: (id, patch) => {
        const c = campaigns.find((x) => x.id === id);
        if (!c) return { ok: false as const, reason: "Campaign not found." };
        // "" (a cleared date / "No end") normalizes to undefined, so every
        // truthiness guard downstream keeps working on updated campaigns.
        const nextStart = patch.startAt !== undefined ? patch.startAt || undefined : c.startAt;
        const nextEnd = patch.endAt !== undefined ? patch.endAt || undefined : c.endAt;
        // Schedule edits obey the record: a voted run's start never moves,
        // and published-run date changes re-resolve the status honestly.
        const result = scheduleEdit(c, nextStart, nextEnd);
        if (!result.ok) return result;
        patchCampaign(id, (x) => {
          const target = patch.target !== undefined ? patch.target : x.target;
          return {
            ...x,
            name: patch.name?.trim() || x.name,
            decision: patch.decision !== undefined ? patch.decision.trim() : x.decision,
            startAt: nextStart,
            endAt: nextEnd,
            target,
            event: patch.event !== undefined ? patch.event : x.event,
            category: patch.category ?? x.category,
            status: result.status,
            // The signal always re-derives (status or target may have moved),
            // mirroring publishCampaign/endCampaign — never a stale verdict.
            signal: signalFor({
              status: result.status,
              voters: x.voters,
              target,
              marginPts: x.winner?.marginPts ?? 0,
            }),
            // An edit that lands a voted run in the past ends it for real —
            // the mid-run narrative flips to ended-voice, like endCampaign.
            ...(result.status === "Ended" && x.status !== "Ended" && x.voters > 0
              ? {
                  summary: `Voting closed ${fmtDate(nextEnd!)} with ${fmtInt(x.voters)} voters${
                    x.target ? ` of the ${fmtInt(x.target)} target` : ""
                  }.`,
                  nextStep: "Review the recommendation and lock the direction.",
                }
              : {}),
          };
        });
        return result;
      },
      addQuestionToCampaign: (campaignId, q) =>
        patchCampaign(campaignId, (c) => {
          const qid = uniqueId(`${c.id}-${q.question}`, new Set(c.chain.map((x) => x.id)));
          const question: ChainQuestion = { id: qid, splitA: 0, ...q };
          return {
            ...c,
            chain: [...c.chain, question],
            votesByQuestion: [...c.votesByQuestion, 0],
          };
        }),
      addLibraryPolstToCampaign: (campaignId, polstId) => {
        const source = polsts.find((p) => p.id === polstId);
        if (!source) return;
        patchCampaign(campaignId, (c) => ({
          ...c,
          chain: [
            ...c.chain,
            {
              id: uniqueId(`${c.id}-${source.id}`, new Set(c.chain.map((x) => x.id))),
              question: source.question,
              optionA: source.optionA,
              optionB: source.optionB,
              splitA: 0,
            },
          ],
          votesByQuestion: [...c.votesByQuestion, 0],
        }));
      },
      removeChainQuestion: (campaignId, questionId) =>
        patchCampaign(campaignId, (c) => {
          const index = c.chain.findIndex((q) => q.id === questionId);
          if (index === -1 || c.voters > 0) return c; // never edit a chain with traffic
          return {
            ...c,
            chain: c.chain.filter((q) => q.id !== questionId),
            votesByQuestion: c.votesByQuestion.filter((_, i) => i !== index),
            decisionIndex: Math.min(c.decisionIndex, Math.max(0, c.chain.length - 2)),
          };
        }),
      reorderChain: (campaignId, from, to) =>
        patchCampaign(campaignId, (c) => {
          if (c.voters > 0) return c; // order is part of the evidence once live
          const chain = [...c.chain];
          const [moved] = chain.splice(from, 1);
          if (!moved) return c;
          chain.splice(to, 0, moved);
          return { ...c, chain };
        }),
      publishCampaign: (id) => {
        // Validation reads the rendered state — fine for click-driven flows;
        // batching several mutations in one tick would need a reducer.
        const c = campaigns.find((x) => x.id === id);
        if (!c) return { ok: false as const, reason: "Campaign not found." };
        if (!c.chain.length) return { ok: false as const, reason: "Add at least one Polst first." };
        if (!c.startAt) return { ok: false as const, reason: "Set a schedule first." };
        if (c.endAt && c.endAt < c.startAt)
          return { ok: false as const, reason: "The end date is before the start." };
        const status = publishedStatus(c.startAt, c.endAt);
        patchCampaign(id, (x) => ({
          ...x,
          status,
          signal: signalFor({ status, voters: x.voters, target: x.target, marginPts: 0 }),
        }));
        return { ok: true as const, status };
      },
      // A run that collected votes never rewinds to Draft — the evidence is
      // part of the record. Ending it is the honest exit.
      unpublishCampaign: (id) => {
        const c = campaigns.find((x) => x.id === id);
        if (!c) return { ok: false as const, reason: "Campaign not found." };
        if (c.voters > 0)
          return {
            ok: false as const,
            reason: "This run has collected votes — end it instead.",
          };
        patchCampaign(id, (x) => ({ ...x, status: "Draft", signal: "Not started" }));
        return { ok: true as const };
      },
      // Restoring from the archive mirrors restorePolst: a voted run comes
      // back as Ended (its results are the record), a clean one as Draft.
      restoreCampaign: (id) => {
        const c = campaigns.find((x) => x.id === id);
        const status: Status = c && c.voters > 0 ? "Ended" : "Draft";
        patchCampaign(id, (x) =>
          x.voters > 0
            ? {
                ...x,
                status: "Ended",
                signal: signalFor({
                  status: "Ended",
                  voters: x.voters,
                  target: x.target,
                  marginPts: x.winner?.marginPts ?? 0,
                }),
              }
            : { ...x, status: "Draft", signal: "Not started" },
        );
        return status;
      },
      endCampaign: (id) =>
        patchCampaign(id, (c) => ({
          ...c,
          status: "Ended",
          endAt: TODAY,
          signal: signalFor({
            status: "Ended",
            voters: c.voters,
            target: c.target,
            marginPts: c.winner?.marginPts ?? 0,
          }),
          // The authored summary/next step speak in mid-run voice ("two days
          // remain…"), which turns false the moment the run ends in-session.
          // The brief and report switch to ended-voice facts instead.
          summary: `Voting closed ${fmtDate(TODAY)} with ${fmtInt(c.voters)} voters${
            c.target ? ` of the ${fmtInt(c.target)} target` : ""
          }.`,
          nextStep: "Review the recommendation and lock the direction.",
        })),
      archiveCampaign: (id) => patchCampaign(id, (c) => ({ ...c, status: "Archived" })),

      createPolst,
      updatePolst: (id, patch) =>
        patchPolst(id, (p) => ({
          ...p,
          question: patch.question?.trim() || p.question,
          optionA: patch.optionA?.trim() || p.optionA,
          optionB: patch.optionB?.trim() || p.optionB,
          startAt: patch.startAt !== undefined ? patch.startAt : p.startAt,
          endAt: patch.endAt !== undefined ? patch.endAt : p.endAt,
          event: patch.event !== undefined ? patch.event : p.event,
          category: patch.category ?? p.category,
        })),
      publishPolst: (id) => {
        const p = polsts.find((x) => x.id === id);
        if (!p) return { ok: false as const, reason: "Polst not found." };
        if (!p.question || !p.optionA || !p.optionB)
          return { ok: false as const, reason: "Finish the question and both options first." };
        if (p.endAt && p.startAt && p.endAt < p.startAt)
          return { ok: false as const, reason: "The end date is before the start." };
        const status = publishedStatus(p.startAt, p.endAt);
        patchPolst(id, (x) => ({ ...x, status: publishedStatus(x.startAt, x.endAt) }));
        return { ok: true as const, status };
      },
      archivePolst: (id) => patchPolst(id, (p) => ({ ...p, status: "Archived" })),
      // A run that collected votes can't go back to Draft — its evidence is
      // part of the record, so it restores as Ended instead. Returns the
      // resulting status so the UI speaks the true destination.
      restorePolst: (id) => {
        const p = polsts.find((x) => x.id === id);
        const status: Status = p && p.votes > 0 ? "Ended" : "Draft";
        patchPolst(id, (x) => ({ ...x, status: x.votes > 0 ? "Ended" : "Draft" }));
        return status;
      },

      addSource: (input) => {
        const id = uniqueId(input.name, new Set(sources.map((s) => s.id)));
        setSources((all) => {
          if (all.some((s) => s.id === id)) return all;
          return [
            {
              id,
              name: input.name.trim(),
              kind: input.kind,
              channel: input.channel,
              placement: input.placement,
              linked: input.linked ?? null,
              createdAt: TODAY,
              voters: 0,
              views: 0,
              completed: 0,
              completionRate: null,
            } as Source,
            ...all,
          ];
        });
        return id;
      },
      assignSource: (sourceId, linked) =>
        setSources((all) =>
          all.map((s) => (s.id === sourceId ? { ...s, linked } : s)),
        ),
      // Undoes a mis-click while the wiring is still clean. Once a source
      // delivered voters, its attribution is evidence — the numbers on the
      // linked run's record — so it stays, the same rule as unpublish.
      unassignSource: (sourceId) => {
        const s = sources.find((x) => x.id === sourceId);
        if (!s) return { ok: false as const, reason: "Source not found." };
        if (s.voters > 0)
          return {
            ok: false as const,
            reason: "This source has collected voters — its attribution is part of the record.",
          };
        setSources((all) =>
          all.map((x) => (x.id === sourceId ? { ...x, linked: null } : x)),
        );
        return { ok: true as const };
      },

      members,
      // Members live in the store like every other in-session creation, so
      // an added row survives navigating away from Team & access. One email
      // is one account — a duplicate address never mints a second row (the
      // Add-member modal refuses it up front; this is the backstop).
      addMember: (name, email) =>
        setMembers((all) =>
          all.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())
            ? all
            : [
                ...all,
                {
                  id: uniqueId(name, new Set(all.map((m) => m.id))),
                  name: name.trim(),
                  email: email.trim(),
                  role: "Manager",
                },
              ],
        ),

      markNotificationRead: (id) =>
        setNotifications((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllNotificationsRead: () =>
        setNotifications((all) => all.map((n) => ({ ...n, read: true }))),
      unreadCount: visibleNotifications.filter((n) => !n.read).length,
    }),
    [campaigns, polsts, sources, members, visibleNotifications, createCampaign, createPolst, patchCampaign, patchPolst],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useWorkspace(): WorkspaceStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return store;
}
