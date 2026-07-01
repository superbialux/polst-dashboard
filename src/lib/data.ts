import {
  type PollCardProps,
  type PollOption,
  type PollStep,
} from "@/components/PollCard";
import { FEED_POLLS } from "@/cards/variants";

const img = (seed: string, w = 600, h = 450) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/* ── Topics directory ─────────────────────────────────────────── */

export type Topic = {
  name: string;
  description: string;
  image: string;
  polls: number;
  votes: number;
  subtopics: string[];
};

export const TOPICS: Topic[] = [
  {
    name: "Politics",
    description: "Elections, policy, and public issues.",
    image: img("topic-politics", 640, 360),
    polls: 1284,
    votes: 412000,
    subtopics: ["elections", "policy", "government", "democracy"],
  },
  {
    name: "Technology",
    description: "Innovation, software, and future tech.",
    image: img("topic-technology", 640, 360),
    polls: 1096,
    votes: 378000,
    subtopics: ["gadgets", "innovation", "startups", "software"],
  },
  {
    name: "Business",
    description: "Companies, careers, and leadership.",
    image: img("topic-business", 640, 360),
    polls: 842,
    votes: 296000,
    subtopics: ["startups", "leadership", "careers", "markets"],
  },
  {
    name: "Finance",
    description: "Markets, crypto, and money decisions.",
    image: img("topic-finance", 640, 360),
    polls: 731,
    votes: 254000,
    subtopics: ["investing", "markets", "crypto", "saving"],
  },
  {
    name: "Sports",
    description: "Teams, athletes, and fan debates.",
    image: img("topic-sports", 640, 360),
    polls: 668,
    votes: 231000,
    subtopics: ["nba", "nfl", "soccer", "olympics"],
  },
  {
    name: "Entertainment",
    description: "Movies, music, TV, and pop culture.",
    image: img("topic-entertainment", 640, 360),
    polls: 590,
    votes: 204000,
    subtopics: ["movies", "music", "tv", "celebrities"],
  },
  {
    name: "AI",
    description: "Automation, tools, ethics, and AI trends.",
    image: img("topic-ai", 640, 360),
    polls: 512,
    votes: 187000,
    subtopics: ["ai", "machine-learning", "ethics", "agents"],
  },
  {
    name: "Economics",
    description: "Inflation, jobs, policy, and trade.",
    image: img("topic-economics", 640, 360),
    polls: 444,
    votes: 152000,
    subtopics: ["economy", "policy", "inflation", "trade"],
  },
  {
    name: "Lifestyle",
    description: "Health, travel, food, and daily life.",
    image: img("topic-lifestyle", 640, 360),
    polls: 405,
    votes: 139000,
    subtopics: ["health", "travel", "food", "wellness"],
  },
];

/* ── Notifications ───────────────────────────────────────────── */

export type Notification = {
  id: string;
  icon: string;
  tone: "violet" | "red" | "green" | "neutral";
  text: string;
  detail?: string;
  ago: string;
  unread: boolean;
  /** Route the row opens (usually a poll). */
  to?: string;
};

/** Every "your poll" reference points at a poll the account actually owns
 *  (see OWN_POLLS below), with counts that match the cards. */
export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    icon: "how_to_vote",
    tone: "violet",
    text: "Your poll passed 10K votes",
    detail: "“What will shape the future of work more?” is trending in Technology.",
    ago: "12m",
    unread: true,
    to: "/poll/what-will-shape-the-future-of-work-more",
  },
  {
    id: "n2",
    icon: "person_add",
    tone: "green",
    text: "FoodieWeekly followed you",
    ago: "1h",
    unread: true,
  },
  {
    id: "n3",
    icon: "favorite",
    tone: "red",
    text: "Wanderlust liked your poll",
    detail: "“What should schools focus on more?”",
    ago: "3h",
    unread: true,
    to: "/poll/what-should-schools-focus-on-more",
  },
  {
    id: "n4",
    icon: "schedule",
    tone: "neutral",
    text: "Your poll ends in 2 days",
    detail: "“What will shape the future of work more?” — 12.6K votes so far.",
    ago: "1d",
    unread: false,
    to: "/poll/what-will-shape-the-future-of-work-more",
  },
  {
    id: "n5",
    icon: "repeat",
    tone: "green",
    text: "CircuitDaily reposted your poll",
    detail: "“What should schools focus on more?”",
    ago: "2d",
    unread: false,
    to: "/poll/what-should-schools-focus-on-more",
  },
];

/* ── Daily Six — the multi-step poll in the feed ─────────────── */

const DAILY_QUESTIONS: PollStep[] = [
    {
      question: "Work from home or from an office?",
      options: [
        { label: "Home", image: img("series-home"), votes: 6800 },
        { label: "Office", image: img("series-office"), votes: 3100 },
      ],
    },
    {
      question: "Save money or spend on experiences?",
      options: [
        { label: "Save it", image: img("series-save"), votes: 4400 },
        { label: "Spend it", image: img("series-spend"), votes: 5800 },
      ],
    },
    {
      question: "Books or podcasts to learn something?",
      options: [
        { label: "Books", image: img("series-books"), votes: 5300 },
        { label: "Podcasts", image: img("series-podcasts"), votes: 4900 },
      ],
    },
    {
      question: "City weekend or cabin weekend?",
      options: [
        { label: "City", image: img("series-city"), votes: 3900 },
        { label: "Cabin", image: img("series-cabin"), votes: 7200 },
      ],
    },
    {
      question: "Cook at home or order takeout tonight?",
      options: [
        { label: "Cook", image: img("series-cook"), votes: 6100 },
        { label: "Takeout", image: img("series-takeout"), votes: 4200 },
      ],
    },
    {
      question: "Early bird or night owl?",
      options: [
        { label: "Early bird", image: img("series-early"), votes: 4700 },
        { label: "Night owl", image: img("series-night"), votes: 5600 },
      ],
    },
];

/** The Daily Six is a regular poll card in every way — author, meta,
 *  hashtags, actions — it just carries six questions instead of one. */
export const DAILY_SIX_POLL: PollCardProps = {
  author: "Polst",
  authorColor: "var(--color-ink-purple)",
  authorBadge: "DAILY",
  isFollowing: true,
  postedAgo: "4h",
  location: "Worldwide",
  categories: ["Lifestyle", "Culture"],
  question: DAILY_QUESTIONS[0].question,
  options: DAILY_QUESTIONS[0].options,
  steps: DAILY_QUESTIONS,
  tags: ["dailysix", "thisorthat", "everyday"],
  likes: 4200,
  reposts: 318,
  votes: DAILY_QUESTIONS.reduce(
    (sum, q) => sum + q.options[0].votes! + q.options[1].votes!,
    0,
  ),
  timeLeft: "8h",
};

/* ── Onboarding interest steps (step 3) ──────────────────────────
   Same shape as the multi-step poll so onboarding literally runs the
   product's poll UI; the vote counts are community shares, shown after
   each pick to teach how Polst works. */

export const INTEREST_STEPS: PollStep[] = [
  {
    question: "Which one do you prefer?",
    options: [
      { label: "Finance", image: img("interest-finance"), votes: 5900 },
      { label: "Politics", image: img("interest-politics"), votes: 4100 },
    ],
  },
  {
    question: "Which one do you prefer?",
    options: [
      { label: "Movies", image: img("interest-movies"), votes: 6400 },
      { label: "Music", image: img("interest-music"), votes: 7800 },
    ],
  },
  {
    question: "Which one do you prefer?",
    options: [
      { label: "Travel", image: img("interest-travel"), votes: 8200 },
      { label: "Food", image: img("interest-food"), votes: 6900 },
    ],
  },
  {
    question: "Which one do you prefer?",
    options: [
      { label: "Climate", image: img("interest-climate"), votes: 3600 },
      { label: "Space", image: img("interest-space"), votes: 5200 },
    ],
  },
  {
    question: "Which one do you prefer?",
    options: [
      { label: "Basketball", image: img("interest-basketball"), votes: 4800 },
      { label: "Art", image: img("interest-art"), votes: 4300 },
    ],
  },
];

/* ── Profile content ─────────────────────────────────────────── */

export type ActivityKind = "started" | "shared" | "voted" | "liked";

export type ActivityItem = {
  kind: ActivityKind;
  /** For "voted": the option the account picked. */
  votedFor?: string;
  ago: string;
  poll: PollCardProps;
};

/** URL slug for a poll, derived from its question. */
export function pollSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** The account's polls — authored under its own name. */
const OWN_POLLS: PollCardProps[] = [
  {
    author: "MaxPolst",
    authorColor: "var(--color-purple-tint)",
    authorBadge: "MP",
    isFollowing: true,
    postedAgo: "3h",
    location: "Chicago, IL",
    categories: ["Technology", "Work & Employment"],
    question: "What will shape the future of work more?",
    options: [
      { label: "AI automation", image: img("work-ai"), votes: 7400 },
      { label: "Human creativity", image: img("work-human"), votes: 5200 },
    ],
    tags: ["ai", "work", "automation", "future"],
    likes: 1000,
    reposts: 532,
    votes: 12600,
    timeLeft: "2d",
  },
  {
    author: "MaxPolst",
    authorColor: "var(--color-purple-tint)",
    authorBadge: "MP",
    isFollowing: true,
    postedAgo: "2d",
    location: "Chicago, IL",
    categories: ["Lifestyle", "Society"],
    question: "What should schools focus on more?",
    options: [
      {
        label: "Practical life skills",
        image: img("school-skills"),
        votes: 9800,
      },
      {
        label: "Academic knowledge",
        image: img("school-academic"),
        votes: 4100,
      },
    ],
    tags: ["education", "school", "skills", "society"],
    likes: 842,
    reposts: 211,
    votes: 13900,
    timeLeft: "1d",
  },
];

/* ── Chicago burger polls — the curated search/SEO showcase ──── */

/** The matchup the "Best Burger in Chicago" page answers with. */
export const BURGER_POLL: PollCardProps = {
  author: "ChicagoEats",
  authorColor: "var(--color-red)",
  authorBadge: "EATS",
  postedAgo: "6h",
  location: "Chicago, IL",
  categories: ["Food", "Lifestyle"],
  question: "Au Cheval or Small Cheval?",
  options: [
    { label: "Au Cheval", image: img("burger-aucheval"), votes: 4640 },
    { label: "Small Cheval", image: img("burger-smallcheval"), votes: 2744 },
  ],
  tags: ["burgers", "chicago", "food"],
  likes: 921,
  reposts: 204,
  votes: 7384,
  timeLeft: "2d",
};

/** Follow-on questions that keep the answering session going. */
export const BURGER_FOLLOW_ONS: PollCardProps[] = [
  {
    author: "ChicagoEats",
    authorColor: "var(--color-red)",
    authorBadge: "EATS",
    postedAgo: "1d",
    location: "Chicago, IL",
    categories: ["Food"],
    question: "Best smash burger in Chicago?",
    options: [
      { label: "Red Hot Ranch", image: img("burger-smash-1"), votes: 1104 },
      { label: "Kuma's Corner", image: img("burger-smash-2"), votes: 738 },
    ],
    tags: ["burgers", "chicago", "smashburger"],
    likes: 310,
    reposts: 64,
    votes: 1842,
    timeLeft: "1d",
  },
  {
    author: "LateNightLoop",
    authorColor: "var(--color-yellow)",
    authorBadge: "LOOP",
    postedAgo: "2d",
    location: "Chicago, IL",
    categories: ["Food"],
    question: "Best late-night burger?",
    options: [
      { label: "The Wieners Circle", image: img("burger-late-1"), votes: 689 },
      { label: "Diner Grill", image: img("burger-late-2"), votes: 567 },
    ],
    tags: ["burgers", "chicago", "latenight"],
    likes: 187,
    reposts: 41,
    votes: 1256,
    timeLeft: "5h",
  },
  {
    author: "BudgetBites",
    authorColor: "var(--color-green)",
    authorBadge: "SAVE",
    postedAgo: "3d",
    location: "Chicago, IL",
    categories: ["Food"],
    question: "Best burger under $15?",
    options: [
      { label: "Small Cheval", image: img("burger-cheap-1"), votes: 941 },
      { label: "Redhot Ranch", image: img("burger-cheap-2"), votes: 732 },
    ],
    tags: ["burgers", "chicago", "budget"],
    likes: 244,
    reposts: 58,
    votes: 1673,
    timeLeft: "12h",
  },
  {
    author: "RiverNorthie",
    authorColor: "var(--color-brand-purple)",
    authorBadge: "RVN",
    postedAgo: "4d",
    location: "Chicago, IL",
    categories: ["Food"],
    question: "Best burger in River North?",
    options: [
      { label: "Bavette's", image: img("burger-rn-1"), votes: 561 },
      { label: "3 Greens Market", image: img("burger-rn-2"), votes: 426 },
    ],
    tags: ["burgers", "chicago", "rivernorth"],
    likes: 132,
    reposts: 27,
    votes: 987,
    timeLeft: "1d",
  },
];

/* ── One anchor poll per directory topic ─────────────────────────
   Keeps every /topic page genuinely populated (the feed's polls cover
   Technology, Economics, Food, Lifestyle, Travel, and Pets already). */

const TOPIC_POLLS: PollCardProps[] = [
  {
    author: "CivicPulse",
    authorColor: "var(--color-ink-purple)",
    authorBadge: "VOTE",
    postedAgo: "5h",
    location: "Washington, DC",
    categories: ["Politics"],
    question: "Should election day be a holiday?",
    options: [
      { label: "Make it a holiday", image: img("politics-holiday"), votes: 9100 },
      { label: "Keep it as is", image: img("politics-keep"), votes: 3400 },
    ],
    tags: ["elections", "policy", "democracy"],
    likes: 1900,
    reposts: 410,
    votes: 12500,
    timeLeft: "1d",
  },
  {
    author: "BoardroomDaily",
    authorColor: "var(--color-green)",
    authorBadge: "BIZ",
    postedAgo: "9h",
    location: "New York, NY",
    categories: ["Business", "Finance"],
    question: "Does a four-day week beat five?",
    options: [
      { label: "Four days", image: img("business-four"), votes: 11200 },
      { label: "Five days", image: img("business-five"), votes: 4100 },
    ],
    tags: ["work", "startups", "productivity"],
    likes: 2200,
    reposts: 530,
    votes: 15300,
    timeLeft: "2d",
  },
  {
    author: "MarketMinute",
    authorColor: "var(--color-yellow)",
    authorBadge: "FIN",
    postedAgo: "1d",
    location: "New York, NY",
    categories: ["Finance", "Economics"],
    question: "Where would you put $10K today?",
    options: [
      { label: "Index funds", image: img("finance-index"), votes: 8600 },
      { label: "Real estate", image: img("finance-realestate"), votes: 6900 },
    ],
    tags: ["investing", "markets", "money"],
    likes: 1600,
    reposts: 340,
    votes: 15500,
    timeLeft: "12h",
  },
  {
    author: "LockerRoom",
    authorColor: "var(--color-red)",
    authorBadge: "GAME",
    postedAgo: "7h",
    location: "Boston, MA",
    categories: ["Sports"],
    question: "Better to watch live: NBA or NFL?",
    options: [
      { label: "NBA", image: img("sports-nba"), votes: 7800 },
      { label: "NFL", image: img("sports-nfl"), votes: 9400 },
    ],
    tags: ["nba", "nfl", "gameday"],
    likes: 2900,
    reposts: 720,
    votes: 17200,
    timeLeft: "8h",
  },
  {
    author: "ScreenScene",
    authorColor: "var(--color-brand-purple)",
    authorBadge: "SHOW",
    postedAgo: "3h",
    location: "Los Angeles, CA",
    categories: ["Entertainment"],
    question: "Movie night: theater or streaming?",
    options: [
      { label: "Theater", image: img("ent-theater"), votes: 5200 },
      { label: "Streaming", image: img("ent-streaming"), votes: 8800 },
    ],
    tags: ["movies", "streaming", "popcorn"],
    likes: 1400,
    reposts: 280,
    votes: 14000,
    timeLeft: "1d",
  },
  {
    author: "FutureFeed",
    authorColor: "var(--color-neutral-800)",
    authorBadge: "AI",
    postedAgo: "2h",
    location: "San Francisco, CA",
    categories: ["AI", "Technology"],
    question: "Would you trust an AI diagnosis?",
    options: [
      { label: "Trust the AI", image: img("ai-trust"), votes: 4300 },
      { label: "Human doctors only", image: img("ai-human"), votes: 7600 },
    ],
    tags: ["ai", "health", "ethics"],
    likes: 2100,
    reposts: 460,
    votes: 11900,
    timeLeft: "2d",
  },
];

/** Every poll the prototype knows about — the poll page looks up here. */
export const ALL_POLLS: PollCardProps[] = [
  ...FEED_POLLS,
  ...OWN_POLLS,
  ...TOPIC_POLLS,
  BURGER_POLL,
  ...BURGER_FOLLOW_ONS,
];

/* ── Discovery filters (category / hashtag / location pages) ─── */

/** City from a poll's "City, ST" location. */
export function pollCity(location?: string): string | undefined {
  return location?.split(",")[0]?.trim();
}

export const pollsByCategory = (name: string) =>
  ALL_POLLS.filter((p) =>
    p.categories?.some((c) => c.toLowerCase() === name.toLowerCase()),
  );

export const pollsByTag = (tag: string) =>
  ALL_POLLS.filter((p) =>
    p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );

export const pollsByCity = (city: string) =>
  ALL_POLLS.filter(
    (p) => pollCity(p.location)?.toLowerCase() === city.toLowerCase(),
  );

/** The busiest polls overall — the last-resort fill so discovery pages
 *  never render empty. */
export const popularPolls = (limit = 6) =>
  [...ALL_POLLS].sort((a, b) => b.votes - a.votes).slice(0, limit);

export type Hashtag = { tag: string; polls: number; votes: number };

/** Hashtags ranked by the volume of the polls carrying them. */
export function trendingHashtags(polls: PollCardProps[] = ALL_POLLS): Hashtag[] {
  const byTag = new Map<string, Hashtag>();
  for (const poll of polls) {
    for (const tag of poll.tags ?? []) {
      const entry = byTag.get(tag) ?? { tag, polls: 0, votes: 0 };
      entry.polls += 1;
      entry.votes += poll.votes;
      byTag.set(tag, entry);
    }
  }
  return [...byTag.values()].sort((a, b) => b.votes - a.votes);
}

/* ── Search / SEO answer pages ───────────────────────────────── */

export type SeoAnswer = {
  slug: string;
  title: string;
  breadcrumbs: { label: string; to: string }[];
  intro: string;
  /** The headline answer — who's winning right now. */
  leader: { name: string; share: number; trend: string; updated: string };
  stats: { totalVotes: number; answersToday: number; place?: string };
  /** The primary votable poll. */
  poll: PollCardProps;
  /** Follow-on questions ("Continue answering"). */
  followOns: PollCardProps[];
  /** Ranked contenders across the whole question. */
  leaderboard: { name: string; share: number }[];
  relatedTopics: { label: string; to: string }[];
  trendingNearby: { label: string; change: string; to: string }[];
  /** Editable title keywords. Absent → the plain `title` renders. */
  keywords?: {
    subject: string;
    place?: string;
    subjectSuggestions?: string[];
    placeSuggestions?: string[];
  };
  /** Champion-ladder contenders (≥ 3), ordered strongest-first. Absent → the
   *  page keeps showing the single `poll`. Aggregate shares for the per-step
   *  count-up ride on each option's `votes`. */
  ladder?: {
    contenders: PollOption[];
  };
};

/** The hand-curated showcase: polst.com/q/best-burger-in-chicago. */
const BEST_BURGER_PAGE: SeoAnswer = {
  slug: "best-burger-in-chicago",
  title: "Best Burger in Chicago",
  breadcrumbs: [
    { label: "Chicago", to: "/place/Chicago" },
    { label: "Food", to: "/topic/Food" },
    { label: "Burgers", to: "/tag/burgers" },
  ],
  intro:
    "Live public opinion from Chicago locals and visitors. Vote in Polsts, see what's trending, and help crown the best.",
  leader: {
    name: "Au Cheval",
    share: 35,
    trend: "+6% this week",
    updated: "2h ago",
  },
  stats: { totalVotes: 8742, answersToday: 432, place: "Chicago" },
  keywords: {
    subject: "Burger",
    place: "Chicago",
    subjectSuggestions: ["Burger", "Deep Dish Pizza", "Hot Dog", "Italian Beef"],
    placeSuggestions: ["Chicago", "New York", "Los Angeles", "Austin"],
  },
  ladder: {
    contenders: [
      { label: "Au Cheval", image: img("burger-aucheval"), votes: 4640 },
      { label: "Small Cheval", image: img("burger-smallcheval"), votes: 2744 },
      { label: "The Loyalist", image: img("burger-loyalist"), votes: 1880 },
      { label: "Redhot Ranch", image: img("burger-redhot"), votes: 1104 },
    ],
  },
  poll: BURGER_POLL,
  followOns: BURGER_FOLLOW_ONS,
  leaderboard: [
    { name: "Au Cheval", share: 35 },
    { name: "Small Cheval", share: 26 },
    { name: "The Loyalist", share: 17 },
    { name: "Redhot Ranch", share: 13 },
    { name: "Kuma's Corner", share: 9 },
  ],
  relatedTopics: [
    { label: "Chicago Pizza", to: "/q/best-pizza-in-chicago" },
    { label: "Chicago Hot Dogs", to: "/q/best-hot-dog-in-chicago" },
    { label: "Food", to: "/topic/Food" },
    { label: "#burgers", to: "/tag/burgers" },
  ],
  trendingNearby: [
    { label: "Best Burger in Chicago", change: "+22%", to: "/q/best-burger-in-chicago" },
    { label: "Au Cheval or Small Cheval?", change: "+28%", to: `/poll/${pollSlug(BURGER_POLL.question)}` },
    { label: "Best late-night burger?", change: "+21%", to: `/poll/${pollSlug("Best late-night burger?")}` },
    { label: "Best burger under $15?", change: "+18%", to: `/poll/${pollSlug("Best burger under $15?")}` },
  ],
};

const SEO_PAGES: Record<string, SeoAnswer> = {
  [BEST_BURGER_PAGE.slug]: BEST_BURGER_PAGE,
};

const STOPWORDS = new Set([
  "best", "in", "the", "a", "an", "or", "vs", "what", "whats", "of",
  "for", "is", "better", "top", "to",
]);

const titleCase = (words: string[]) =>
  words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** Token-scored poll search — the matcher behind both the inline search
 *  results and the aggregated answer pages. */
export function searchPolls(query: string): PollCardProps[] {
  const terms = query
    .toLowerCase()
    .split(/[\s-]+/)
    .filter((w) => w && !STOPWORDS.has(w));
  if (terms.length === 0) return [];

  return ALL_POLLS.map((poll) => {
    const haystack = [
      poll.question,
      poll.location ?? "",
      ...(poll.categories ?? []),
      ...(poll.tags ?? []),
      ...poll.options.map((o) => o.label),
    ]
      .join(" ")
      .toLowerCase();
    const score = terms.filter((t) => haystack.includes(t)).length;
    return { poll, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.poll.votes - a.poll.votes)
    .map((s) => s.poll);
}

/** Resolve a search slug to an answer page: curated when we have one,
 *  otherwise synthesized live from the polls that match the query — the
 *  page answers the question instead of dumping database rows. */
export function seoAnswerFor(slug: string): SeoAnswer | null {
  const curated = SEO_PAGES[slug];
  if (curated) return curated;

  const words = slug.toLowerCase().split("-").filter(Boolean);
  const matches = searchPolls(slug);
  if (matches.length === 0) return null;

  const top = matches[0];
  const totalVotes = matches.reduce((sum, p) => sum + p.votes, 0);

  // The contender field: distinct options across the matches, busiest first.
  // One share basis for both the headline answer and the standings — shares
  // are of this field and sum to 100, so the banner and the board agree.
  const field = matches
    .flatMap((p) => p.options)
    .filter((o, i, arr) => arr.findIndex((x) => x.label === o.label) === i)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 5);
  const fieldTotal = field.reduce((sum, o) => sum + (o.votes ?? 0), 0) || 1;
  const shares = field.map((o) => Math.round(((o.votes ?? 0) / fieldTotal) * 100));
  // Absorb rounding drift into the leader so the column totals exactly 100.
  shares[0] += 100 - shares.reduce((a, b) => a + b, 0);
  const leaderboard = field.map((o, i) => ({ name: o.label, share: shares[i] }));

  const city = pollCity(top.location);
  const topics = [...new Set(matches.flatMap((p) => p.categories ?? []))];
  const tags = [...new Set(matches.flatMap((p) => p.tags ?? []))];

  // Editable keywords parsed from the slug ("best <subject> in <place>") so
  // every synthesized page — not just curated ones — keeps clickable chips.
  const inIndex = words.indexOf("in");
  const subjectWords = words.slice(
    words[0] === "best" ? 1 : 0,
    inIndex === -1 ? undefined : inIndex,
  );
  const placeWords = inIndex === -1 ? [] : words.slice(inIndex + 1);
  const keywords =
    subjectWords.length > 0
      ? {
          subject: titleCase(subjectWords),
          place: placeWords.length > 0 ? titleCase(placeWords) : city,
          subjectSuggestions: ["Burger", "Pizza", "Coffee", "Tacos", "Sushi"],
          placeSuggestions: ["Chicago", "New York", "Los Angeles", "Austin", "Seattle"],
        }
      : undefined;

  // Champion ladder reuses the same field (top 4) so the drill-down + its
  // create-a-Polst finale exist on every page.
  const contenders = field.slice(0, 4);
  const ladder = contenders.length >= 3 ? { contenders } : undefined;

  return {
    slug,
    title: titleCase(words),
    keywords,
    ladder,
    breadcrumbs: [
      ...(city ? [{ label: city, to: `/place/${encodeURIComponent(city)}` }] : []),
      ...topics.slice(0, 2).map((t) => ({
        label: t,
        to: `/topic/${encodeURIComponent(t)}`,
      })),
    ],
    intro:
      "Live public opinion, aggregated across every matching Polst. Vote to sharpen the answer.",
    leader: {
      name: field[0].label,
      share: shares[0],
      trend: "+4% this week",
      updated: "2h ago",
    },
    stats: {
      totalVotes,
      answersToday: Math.max(12, Math.round(totalVotes * 0.05)),
      place: city,
    },
    poll: top,
    followOns: matches.slice(1, 5),
    leaderboard,
    relatedTopics: [
      ...topics.slice(0, 2).map((t) => ({
        label: t,
        to: `/topic/${encodeURIComponent(t)}`,
      })),
      ...tags.slice(0, 3).map((t) => ({
        label: `#${t}`,
        to: `/tag/${encodeURIComponent(t)}`,
      })),
    ],
    trendingNearby: matches.slice(0, 4).map((p, i) => ({
      label: p.question,
      change: `+${18 - i * 3}%`,
      to: `/poll/${pollSlug(p.question)}`,
    })),
  };
}

/** Slug for a free-text search query. */
export const searchSlug = pollSlug;

export const PROFILE_ACTIVITY: ActivityItem[] = [
  { kind: "started", ago: "3h", poll: OWN_POLLS[0] },
  { kind: "shared", ago: "1d", poll: FEED_POLLS[2] },
  { kind: "voted", votedFor: "Tacos", ago: "1d", poll: FEED_POLLS[1] },
  { kind: "started", ago: "2d", poll: OWN_POLLS[1] },
  { kind: "liked", ago: "3d", poll: FEED_POLLS[3] },
];

export const PROFILE_LIKES: PollCardProps[] = [FEED_POLLS[3], FEED_POLLS[0]];
export const PROFILE_SAVED: PollCardProps[] = [FEED_POLLS[2]];

/** Results tab: how the account's votes landed against the crowd. */
export type VoteResult = {
  poll: PollCardProps;
  votedFor: string;
};

export const PROFILE_RESULTS: VoteResult[] = [
  { poll: FEED_POLLS[1], votedFor: "Tacos" },
  { poll: FEED_POLLS[2], votedFor: "Ocean" },
  { poll: FEED_POLLS[0], votedFor: "Better software" },
  { poll: FEED_POLLS[3], votedFor: "Cats" },
];

/* ── Settings: devices ───────────────────────────────────────── */

export type Device = {
  icon: string;
  name: string;
  meta: string;
  current?: boolean;
};

export const DEVICES: Device[] = [
  {
    icon: "computer",
    name: "Chrome · macOS",
    meta: "Chicago, IL · Active now",
    current: true,
  },
  {
    icon: "smartphone",
    name: "Polst for iOS",
    meta: "Chicago, IL · 2h ago",
  },
  {
    icon: "tablet_mac",
    name: "Safari · iPad",
    meta: "Evanston, IL · Jun 2",
  },
];
