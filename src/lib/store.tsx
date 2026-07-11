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
import { TODAY, signalFor, type Status } from "@/lib/canon";
import {
  CAMPAIGNS,
  SINGLE_POLSTS,
  SOURCES,
  WORKSPACE_NOTIFICATIONS,
  type Campaign,
  type ChainQuestion,
  type Channel,
  type SinglePolst,
  type Source,
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
  vertical: input.vertical ?? "Food & drink",
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
  vertical: input.vertical ?? "Food & drink",
  votes: 0,
  viewsFactor: 2.2,
  interactions: 0,
  views: 0,
  engagementRate: null,
  sources: [],
});

/** Publishing resolves to Active or Scheduled from the object's dates. */
const publishedStatus = (startAt?: string): Status =>
  startAt && startAt > TODAY ? "Scheduled" : "Active";

/* ── Public shape ─────────────────────────────────────────────────── */

export type CreateCampaignInput = {
  name: string;
  decision?: string;
  startAt?: string;
  endAt?: string;
  target?: number;
  event?: string;
  vertical?: Campaign["vertical"];
};

export type CreatePolstInput = {
  question: string;
  optionA: string;
  optionB: string;
  startAt?: string;
  endAt?: string;
  event?: string;
  vertical?: SinglePolst["vertical"];
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
  updateCampaign: (id: string, patch: Partial<CreateCampaignInput>) => void;
  addQuestionToCampaign: (campaignId: string, q: { question: string; optionA: string; optionB: string }) => void;
  addLibraryPolstToCampaign: (campaignId: string, polstId: string) => void;
  removeChainQuestion: (campaignId: string, questionId: string) => void;
  reorderChain: (campaignId: string, from: number, to: number) => void;
  publishCampaign: (id: string) => { ok: true } | { ok: false; reason: string };
  unpublishCampaign: (id: string) => void;
  endCampaign: (id: string) => void;
  archiveCampaign: (id: string) => void;

  createPolst: (input: CreatePolstInput, opts?: { publish?: boolean }) => string;
  updatePolst: (id: string, patch: Partial<CreatePolstInput>) => void;
  publishPolst: (id: string) => { ok: true } | { ok: false; reason: string };
  archivePolst: (id: string) => void;
  restorePolst: (id: string) => void;

  addSource: (input: AddSourceInput) => string;
  assignSource: (sourceId: string, linked: NonNullable<Source["linked"]>) => void;

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

  const createCampaign = useCallback(
    (input: CreateCampaignInput) => {
      let id = "";
      setCampaigns((all) => {
        id = uniqueId(input.name, new Set(all.map((c) => c.id)));
        return [blankCampaign(id, input), ...all];
      });
      return id;
    },
    [],
  );

  const createPolst = useCallback(
    (input: CreatePolstInput, opts?: { publish?: boolean }) => {
      let id = "";
      setPolsts((all) => {
        id = uniqueId(input.question, new Set(all.map((p) => p.id)));
        const polst = blankPolst(id, input);
        return [
          opts?.publish ? { ...polst, status: publishedStatus(polst.startAt) } : polst,
          ...all,
        ];
      });
      return id;
    },
    [],
  );

  const value = useMemo<WorkspaceStore>(
    () => ({
      campaigns,
      polsts,
      sources,
      notifications,
      campaignById: (id) => campaigns.find((c) => c.id === id),
      polstById: (id) => polsts.find((p) => p.id === id),

      createCampaign,
      updateCampaign: (id, patch) =>
        patchCampaign(id, (c) => ({
          ...c,
          name: patch.name?.trim() || c.name,
          decision: patch.decision !== undefined ? patch.decision.trim() : c.decision,
          startAt: patch.startAt !== undefined ? patch.startAt : c.startAt,
          endAt: patch.endAt !== undefined ? patch.endAt : c.endAt,
          target: patch.target !== undefined ? patch.target : c.target,
          event: patch.event !== undefined ? patch.event : c.event,
          vertical: patch.vertical ?? c.vertical,
        })),
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
        const c = campaigns.find((x) => x.id === id);
        if (!c) return { ok: false as const, reason: "Campaign not found." };
        if (!c.chain.length) return { ok: false as const, reason: "Add at least one Polst first." };
        if (!c.startAt) return { ok: false as const, reason: "Set a schedule first." };
        patchCampaign(id, (x) => {
          const status = publishedStatus(x.startAt);
          return {
            ...x,
            status,
            signal: signalFor({ status, voters: x.voters, target: x.target, marginPts: 0 }),
          };
        });
        return { ok: true as const };
      },
      unpublishCampaign: (id) =>
        patchCampaign(id, (c) => ({ ...c, status: "Draft", signal: "Not started" })),
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
          vertical: patch.vertical ?? p.vertical,
        })),
      publishPolst: (id) => {
        const p = polsts.find((x) => x.id === id);
        if (!p) return { ok: false as const, reason: "Polst not found." };
        if (!p.question || !p.optionA || !p.optionB)
          return { ok: false as const, reason: "Finish the question and both options first." };
        patchPolst(id, (x) => ({ ...x, status: publishedStatus(x.startAt) }));
        return { ok: true as const };
      },
      archivePolst: (id) => patchPolst(id, (p) => ({ ...p, status: "Archived" })),
      restorePolst: (id) => patchPolst(id, (p) => ({ ...p, status: "Draft" })),

      addSource: (input) => {
        let id = "";
        setSources((all) => {
          id = uniqueId(input.name, new Set(all.map((s) => s.id)));
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

      markNotificationRead: (id) =>
        setNotifications((all) => all.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllNotificationsRead: () =>
        setNotifications((all) => all.map((n) => ({ ...n, read: true }))),
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
    [campaigns, polsts, sources, notifications, createCampaign, createPolst, patchCampaign, patchPolst],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useWorkspace(): WorkspaceStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return store;
}
