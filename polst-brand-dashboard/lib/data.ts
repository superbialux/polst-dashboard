export type CampaignStatus = 'Live' | 'Draft' | 'Complete' | 'Archived'

export type Campaign = {
  slug: string
  name: string
  /** The business decision this campaign is trying to answer */
  goal: string
  /** Number of Polsts grouped under this decision campaign */
  polsts: number
  status: CampaignStatus
  responses: number | null
  channels: string[]
  lastUpdated: string
  winningOption?: string
  confidence?: 'High' | 'Medium' | 'Low'
  /** Short plain-language summary of what the campaign is telling us so far */
  currentLearning?: string
  /** First Polst question, used as the campaign's "OR" cover thumbnail */
  cover: {
    question: string
    left: { label: string; image: string }
    right: { label: string; image: string }
  }
}

export const organization = {
  name: 'Nike, Inc.',
  domain: 'nike.polst.io',
  plan: 'Enterprise',
  primaryColor: '#4f46e5',
  accentColor: '#0ea5e9',
  billingOwner: 'Emanuel You',
  nextInvoice: 'January 1, 2027',
  }

export const currentUser = {
  name: 'Emanuel You',
  role: 'Marketing Director',
  email: 'emanuel@polst.io',
  initials: 'EY',
}

export const campaigns: Campaign[] = [
  {
    slug: 'holiday-creative',
    name: 'Holiday Creative',
    goal: 'Select national holiday campaign',
    polsts: 3,
    status: 'Live',
    responses: 12411,
    channels: ['Instagram', 'Email', 'Website'],
    lastUpdated: '2m ago',
    winningOption: 'Modern Holiday',
    confidence: 'High',
    currentLearning:
      'Modern Holiday is leading nationally, but QR traffic shows Classic Holiday over-indexing in-store.',
    cover: {
      question: 'Which holiday campaign should we run?',
      left: { label: 'Classic Holiday', image: '/polsts/holiday-classic.png' },
      right: { label: 'Modern Holiday', image: '/polsts/holiday-modern.png' },
    },
  },
  {
    slug: 'shoe-packaging',
    name: 'Shoe Packaging',
    goal: 'Choose final package design',
    polsts: 2,
    status: 'Live',
    responses: 4912,
    channels: ['Instagram', 'Email'],
    lastUpdated: '18m ago',
    winningOption: 'Packaging A',
    currentLearning:
      'Packaging A is winning overall and is especially strong with returning customers.',
    cover: {
      question: 'Which package design should we ship?',
      left: { label: 'Packaging A', image: '/polsts/pkg-a.png' },
      right: { label: 'Packaging B', image: '/polsts/pkg-b.png' },
    },
  },
  {
    slug: 'packaging-test',
    name: 'Packaging Test',
    goal: 'Choose final package design',
    polsts: 2,
    status: 'Draft',
    responses: null,
    channels: ['Instagram', 'Email'],
    lastUpdated: '3d ago',
    cover: {
      question: 'Which box color tests best?',
      left: { label: 'Sunshine Yellow', image: '/polsts/pkgtest-a.png' },
      right: { label: 'Crimson Red', image: '/polsts/pkgtest-b.png' },
    },
  },
  {
    slug: 'retail-display-test',
    name: 'Retail Display Test',
    goal: 'Select retail display concept',
    polsts: 2,
    status: 'Complete',
    responses: 21882,
    channels: ['Website', 'QR'],
    lastUpdated: 'Yesterday',
    winningOption: 'Center Island',
    currentLearning:
      'Center Island won overall, with the East Coast showing the strongest regional preference.',
    cover: {
      question: 'Which retail display concept performs best?',
      left: { label: 'Lime Wall', image: '/polsts/display-a.png' },
      right: { label: 'Pink Podium', image: '/polsts/display-b.png' },
    },
  },
  {
    slug: 'spring-tender-combo',
    name: 'Spring Tender Combo Test',
    goal: 'Choose the spring LTO combo, side & price',
    polsts: 3,
    status: 'Complete',
    responses: 215000,
    channels: ['App', 'Email', 'QR', 'Social'],
    lastUpdated: 'Apr 29',
    winningOption: 'Honey Butter Tenders',
    confidence: 'High',
    currentLearning:
      'Honey Butter wins 62/38 and in-store QR guests show the strongest buy signal at $9.99.',
    cover: {
      question: 'Which new tender combo would you order?',
      left: { label: 'Honey Butter Tenders', image: '/polsts/tenders-honey.png' },
      right: { label: 'Spicy Buffalo Tenders', image: '/polsts/tenders-buffalo.png' },
    },
  },
]

export const recommendations = [
  {
    title: 'Use Modern Holiday nationally — 61% preference across 6,842 responses',
    detail: 'Holiday Creative · won the core creative Polst by 22 points',
  },
  {
    title: 'Packaging A won by 23 points — strongest among returning customers',
    detail: 'Shoe Packaging · high confidence',
  },
  {
    title: 'East Coast prefers Display C — regional rollout recommended',
    detail: 'Retail Display Test · clear regional signal',
  },
]

export const recommendedNextAction = {
  title: 'Create a follow-up Polst for Holiday Creative',
  reason:
    'Modern Holiday won the core creative test, but the headline still needs validation before national rollout.',
}

export const portfolioStats = {
  totalResponses: 39205,
  avgCompletionRate: 87,
  recommendations: 14,
  activeCampaigns: 3,
  completed: 12,
  drafts: 2,
}

export const distributionChannels = [
  { id: 'website', name: 'Website', icon: 'Globe' },
  { id: 'instagram', name: 'Instagram', icon: 'Instagram' },
  { id: 'email', name: 'Email', icon: 'Mail' },
  { id: 'influencers', name: 'Influencers', icon: 'Users' },
  { id: 'app', name: 'App', icon: 'Smartphone' },
  { id: 'qr', name: 'QR', icon: 'QrCode' },
] as const

export const influencers = [
  { name: 'Sarah Jones', responses: 4112, ctr: 12.2, status: 'Active' },
  { name: 'Mike Smith', responses: 3814, ctr: 10.4, status: 'Active' },
  { name: 'Jess Lee', responses: 2992, ctr: 9.3, status: 'Active' },
]

export const audience = {
  followers: 4211,
  previousRespondents: 18922,
  responseReach: '4.49x',
  repeatRespondents: 6304,
  signalQuality: {
    rating: 'Strong',
    explanation:
      'Your audience is producing consistent response patterns across creative, product, and shopping-related Polsts.',
    bullets: [
      '87% average completion across recent Decision Campaigns',
      '4.49x reach beyond followers',
      'Strongest response velocity from Instagram and Email',
      'Highest repeat behavior from Sports and Food topics',
    ],
  },
  topTopics: [
    {
      topic: 'Sports',
      value: 88,
      meaning: 'Sports-related Polsts drive the fastest response velocity.',
      nextPolst: 'Which game-day offer should we test?',
    },
    {
      topic: 'Food',
      value: 73,
      meaning: 'Food questions produce high completion and strong sharing.',
      nextPolst: 'Which limited-time flavor should we launch?',
    },
    {
      topic: 'Entertainment',
      value: 58,
      meaning:
        'Entertainment topics support social sharing and broad reach.',
      nextPolst: 'Which creator partnership should we test?',
    },
    {
      topic: 'Shopping',
      value: 44,
      meaning:
        'Shopping-related Polsts are useful for packaging, pricing, and product decisions.',
      nextPolst: 'Which package design would you buy?',
    },
  ],
  sourceMix: [
    { name: 'Instagram', value: 42 },
    { name: 'Email', value: 31 },
    { name: 'Website', value: 19 },
    { name: 'Influencer', value: 8 },
  ],
  sourceInterpretation:
    'Instagram and Email are the highest-volume channels. Website and QR produce lower volume but stronger purchase-intent signal.',
  behavior: [
    { label: 'Fastest Response Channel', value: 'Instagram' },
    { label: 'Highest Completion Channel', value: 'Email' },
    { label: 'Strongest Purchase Signal', value: 'Website' },
    { label: 'Best Event Signal', value: 'QR' },
  ],
  recommendedActions: [
    'Create a follow-up Polst for the Sports segment',
    'Use Instagram and Email for the next creative test',
    'Use QR only when the question is tied to in-store or event behavior',
    'Test Shopping-related Polsts for packaging and product validation',
  ],
  engagement: [12, 18, 16, 24, 28, 34, 41, 38, 47, 52, 58, 64],
  ageGroups: [
    { group: '18–24', value: 28 },
    { group: '25–34', value: 41 },
    { group: '35–44', value: 22 },
    { group: '45–54', value: 9 },
  ],
}

export const teamMembers = [
  {
    name: 'Emanuel You',
    role: 'Owner',
    email: 'emanuel@polst.io',
    initials: 'EY',
  },
  {
    name: 'Sarah Pike',
    role: 'Editor',
    email: 'sarah@nike.com',
    initials: 'SP',
  },
  {
    name: 'Mike Wilson',
    role: 'Editor',
    email: 'mike@agency.com',
    initials: 'MW',
  },
  {
    name: 'Jessica Taylor',
    role: 'Viewer',
    email: 'jessica@nike.com',
    initials: 'JT',
  },
]

export const pendingInvitations = [
  { email: 'dana@nike.com', role: 'Editor', sentAt: 'Sent 2 days ago' },
  { email: 'agency-team@brandstudio.com', role: 'Viewer', sentAt: 'Sent 5 days ago' },
]

export const roleGuide = [
  {
    role: 'Owner',
    description:
      'Full access to billing, settings, team, campaigns, and insights.',
  },
  {
    role: 'Editor',
    description:
      'Can create and edit Polsts, manage distribution assets, and view insights.',
  },
  {
    role: 'Viewer',
    description: 'Can view campaigns, insights, and reports only.',
  },
]

// Holiday Creative detail data
export const holidayCreative = {
  responses: 12411,
  completion: 87,
  winningOption: 'Modern Holiday',
  confidence: 'High' as const,
  byChannel: [
    { name: 'Instagram', value: 42 },
    { name: 'Email', value: 31 },
    { name: 'Website', value: 19 },
    { name: 'Influencer', value: 8 },
  ],
  byRegion: [
    { region: 'West', value: 31 },
    { region: 'Midwest', value: 18 },
    { region: 'South', value: 24 },
    { region: 'Northeast', value: 27 },
  ],
  byDemographic: [
    { group: '18–24', value: 24 },
    { group: '25–34', value: 38 },
    { group: '35–44', value: 26 },
    { group: '45–54', value: 12 },
  ],
  vote: { a: 39, b: 61 },
  trend: [22, 30, 41, 38, 49, 57, 61],
}

export const distributionAssets = {
  channels: [
    {
      id: 'website',
      name: 'Website Embed',
      icon: 'Globe',
      status: 'Live',
      detail: 'Embedded on nike.com/holiday',
      scope: 'Full Decision Campaign · 3 Polsts',
      metric: '2,361 responses',
      action: 'Copy Code',
      lastAction: 'Last copied 2 days ago',
    },
    {
      id: 'email',
      name: 'Email Link',
      icon: 'Mail',
      status: 'Live',
      detail: 'Newsletter · 1.2M sent',
      scope: 'Full Decision Campaign · 3 Polsts',
      metric: '3,846 responses',
      action: 'Copy Link',
      lastAction: 'Last copied 4 hours ago',
    },
    {
      id: 'instagram',
      name: 'Instagram Link',
      icon: 'Camera',
      status: 'Live',
      detail: 'Story link sticker + bio',
      scope: 'Starts with Polst 1',
      metric: '5,214 responses',
      action: 'Copy Link',
      lastAction: 'Last copied yesterday',
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: 'QrCode',
      status: 'Ready',
      detail: 'In-store retail displays',
      scope: 'Full Decision Campaign',
      metric: '990 responses',
      action: 'Download',
      lastAction: 'Not yet downloaded',
    },
    {
      id: 'influencers',
      name: 'Influencer Links',
      icon: 'Users',
      status: 'Live',
      detail: '4 creators · tracked links',
      scope: 'Unique tracked links per influencer',
      metric: '10,918 responses',
      action: 'Manage Links',
      lastAction: '4 links active',
    },
  ],
  shareLink: 'https://nike.polst.io/c/holiday-creative',
  embedCode: '<iframe src="https://nike.polst.io/embed/holiday-creative" />',
}

export type InfluencerDetail = {
  slug: string
  name: string
  handle: string
  initials: string
  reach: string
  responses: number
  ctr: number
  status: string
  topChannel?: string
  channels: { label: string; value: number; sub: string }[]
  timeline: { days: string[]; responses: number[] }
  demographics: {
    age: { group: string; value: number }[]
    gender: { name: string; value: number }[]
    regions: { label: string; value: number; sub: string }[]
  }
}

export const influencerTracking = {
  totalResponses: 10918,
  totalReach: '2.4M',
  avgCtr: 10.6,
  roster: [
    {
      slug: 'sarahjones',
      name: 'Sarah Jones',
      handle: '@sarahjones',
      initials: 'SJ',
      reach: '880K',
      responses: 4112,
      ctr: 12.2,
      status: 'Active',
      topChannel: 'Instagram',
      channels: [
        { label: 'Instagram', value: 2480, sub: '13.4% CTR' },
        { label: 'TikTok', value: 1090, sub: '11.1% CTR' },
        { label: 'Story Link', value: 542, sub: '9.8% CTR' },
      ],
      timeline: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        responses: [410, 520, 690, 640, 720, 560, 572],
      },
      demographics: {
        age: [
          { group: '18–24', value: 34 },
          { group: '25–34', value: 38 },
          { group: '35–44', value: 18 },
          { group: '45+', value: 10 },
        ],
        gender: [
          { name: 'Women', value: 64 },
          { name: 'Men', value: 33 },
          { name: 'Other', value: 3 },
        ],
        regions: [
          { label: 'West', value: 41, sub: '1,686 responses' },
          { label: 'Northeast', value: 27, sub: '1,110 responses' },
          { label: 'South', value: 21, sub: '864 responses' },
          { label: 'Midwest', value: 11, sub: '452 responses' },
        ],
      },
    },
    {
      slug: 'mikesmith',
      name: 'Mike Smith',
      handle: '@mikesmith',
      initials: 'MS',
      reach: '740K',
      responses: 3814,
      ctr: 10.4,
      status: 'Active',
      topChannel: 'TikTok',
      channels: [
        { label: 'TikTok', value: 2210, sub: '11.8% CTR' },
        { label: 'Instagram', value: 1180, sub: '9.6% CTR' },
        { label: 'YouTube', value: 424, sub: '7.2% CTR' },
      ],
      timeline: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        responses: [380, 460, 540, 610, 690, 580, 554],
      },
      demographics: {
        age: [
          { group: '18–24', value: 46 },
          { group: '25–34', value: 31 },
          { group: '35–44', value: 15 },
          { group: '45+', value: 8 },
        ],
        gender: [
          { name: 'Women', value: 42 },
          { name: 'Men', value: 55 },
          { name: 'Other', value: 3 },
        ],
        regions: [
          { label: 'South', value: 38, sub: '1,449 responses' },
          { label: 'West', value: 26, sub: '992 responses' },
          { label: 'Midwest', value: 22, sub: '839 responses' },
          { label: 'Northeast', value: 14, sub: '534 responses' },
        ],
      },
    },
    {
      slug: 'jesslee',
      name: 'Jess Lee',
      handle: '@jesslee',
      initials: 'JL',
      reach: '512K',
      responses: 2992,
      ctr: 9.3,
      status: 'Active',
      topChannel: 'Instagram',
      channels: [
        { label: 'Instagram', value: 1640, sub: '10.2% CTR' },
        { label: 'Story Link', value: 880, sub: '8.9% CTR' },
        { label: 'TikTok', value: 472, sub: '7.5% CTR' },
      ],
      timeline: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        responses: [300, 380, 420, 460, 510, 470, 452],
      },
      demographics: {
        age: [
          { group: '18–24', value: 29 },
          { group: '25–34', value: 41 },
          { group: '35–44', value: 21 },
          { group: '45+', value: 9 },
        ],
        gender: [
          { name: 'Women', value: 71 },
          { name: 'Men', value: 26 },
          { name: 'Other', value: 3 },
        ],
        regions: [
          { label: 'Northeast', value: 35, sub: '1,047 responses' },
          { label: 'West', value: 30, sub: '898 responses' },
          { label: 'South', value: 20, sub: '598 responses' },
          { label: 'Midwest', value: 15, sub: '449 responses' },
        ],
      },
    },
    {
      slug: 'tombrady',
      name: 'Tom Brady',
      handle: '@tombrady',
      initials: 'TB',
      reach: '310K',
      responses: 0,
      ctr: 0,
      status: 'Invited',
      channels: [],
      timeline: { days: [], responses: [] },
      demographics: { age: [], gender: [], regions: [] },
    },
  ] as InfluencerDetail[],
}

export function getInfluencer(slug: string): InfluencerDetail | undefined {
  return influencerTracking.roster.find((inf) => inf.slug === slug)
}

export const insights = {
  headline: 'Modern Holiday is your national winner',
  summary:
    'Use Modern Holiday as the national campaign direction, with a follow-up Polst to finalize headline and landing page execution.',
  confidence: 92,
  confidenceLabel: 'High',
  confidenceExplanation:
    'High confidence is based on 12,411 total responses, 87% completion, a 22-point win on the core creative Polst, and consistent performance across Instagram, Email, Website, and QR.',
  keyFindings: [
    {
      title: 'Core creative Polst won by 22 points',
      detail:
        'Modern Holiday beat Classic Holiday 61% to 39% across 12,411 responses.',
      type: 'win',
    },
    {
      title: '“Built for the Season” beat “Give More. Move More.”',
      detail: 'The winning headline direction led by 8 points.',
      type: 'win',
    },
    {
      title: 'Athlete Hero won the landing page hero test',
      detail: 'Athlete Hero led the hero creative test by 14 points.',
      type: 'win',
    },
    {
      title: 'Instagram drove the largest response volume',
      detail: 'Instagram contributed the most responses of any channel.',
      type: 'channel',
    },
    {
      title: 'Strongest with women 25–44',
      detail:
        'Women 25–44 showed the strongest preference for the winning direction.',
      type: 'segment',
    },
    {
      title: 'QR slightly over-indexed to Classic Holiday',
      detail:
        'QR traffic leaned toward Classic Holiday, suggesting in-store behavior may differ from social behavior.',
      type: 'watch',
    },
  ],
  recommendations: [
    'Use Modern Holiday for the national campaign.',
    'Run a follow-up headline Polst before final production.',
    'Keep Instagram and Email as the primary rollout channels.',
    'Test a separate in-store QR creative before retail deployment.',
  ],
  followUp: {
    title: 'Suggested Follow-Up Polst',
    question: 'Which final Modern Holiday headline should we run nationally?',
    reason:
      'Modern Holiday won the core creative test, but the final headline still needs validation before national rollout.',
  },
}

export type PolstOption = {
  label: string
  image: string
  votePct: number
}

export type Polst = {
  id: string
  campaignSlug: string
  question: string
  left: PolstOption
  right: PolstOption
  winner: string
  responses: number
  status: CampaignStatus
  channels: string[]
  whyItMattered: string
  byChannel: { channel: string; winner: string; pct: number }[]
}

export const polsts: Polst[] = [
  {
    id: 'holiday-creative-01',
    campaignSlug: 'holiday-creative',
    question: 'Which holiday campaign should we run?',
    left: {
      label: 'Classic Holiday',
      image: '/polsts/holiday-classic.png',
      votePct: 39,
    },
    right: {
      label: 'Modern Holiday',
      image: '/polsts/holiday-modern.png',
      votePct: 61,
    },
    winner: 'Modern Holiday',
    responses: 6842,
    status: 'Live',
    channels: ['Instagram', 'Email', 'Website', 'QR'],
    whyItMattered:
      'Modern Holiday drove the clearest preference and strongest engagement across Instagram and Email.',
    byChannel: [
      { channel: 'Instagram', winner: 'Modern Holiday', pct: 64 },
      { channel: 'Email', winner: 'Modern Holiday', pct: 58 },
      { channel: 'Website', winner: 'Modern Holiday', pct: 55 },
      { channel: 'QR', winner: 'Classic Holiday', pct: 51 },
    ],
  },
  {
    id: 'holiday-creative-02',
    campaignSlug: 'holiday-creative',
    question: 'Which headline should lead the holiday campaign?',
    left: {
      label: 'Give More. Move More.',
      image: '/polsts/headline-give-more.png',
      votePct: 46,
    },
    right: {
      label: 'Built for the Season.',
      image: '/polsts/headline-season.png',
      votePct: 54,
    },
    winner: 'Built for the Season.',
    responses: 3218,
    status: 'Live',
    channels: ['Instagram', 'Email'],
    whyItMattered:
      'The seasonal framing resonated more broadly and paired naturally with the Modern Holiday direction.',
    byChannel: [
      { channel: 'Instagram', winner: 'Built for the Season.', pct: 56 },
      { channel: 'Email', winner: 'Built for the Season.', pct: 52 },
    ],
  },
  {
    id: 'holiday-creative-03',
    campaignSlug: 'holiday-creative',
    question: 'Which landing page hero should we use?',
    left: {
      label: 'Athlete Hero',
      image: '/polsts/hero-athlete.png',
      votePct: 57,
    },
    right: {
      label: 'Product Hero',
      image: '/polsts/hero-product.png',
      votePct: 43,
    },
    winner: 'Athlete Hero',
    responses: 2351,
    status: 'Complete',
    channels: ['Website', 'QR'],
    whyItMattered:
      'The athlete-led hero created a stronger emotional hook and lifted scroll-through on the landing page.',
    byChannel: [
      { channel: 'Website', winner: 'Athlete Hero', pct: 58 },
      { channel: 'QR', winner: 'Athlete Hero', pct: 55 },
    ],
  },

  // --- Shoe Packaging ---
  {
    id: 'shoe-packaging-01',
    campaignSlug: 'shoe-packaging',
    question: 'Which package design should we ship?',
    left: { label: 'Packaging A', image: '/polsts/pkg-a.png', votePct: 58 },
    right: { label: 'Packaging B', image: '/polsts/pkg-b.png', votePct: 42 },
    winner: 'Packaging A',
    responses: 4120,
    status: 'Complete',
    channels: ['Instagram', 'Email', 'QR'],
    whyItMattered:
      'The bold orange box stood out on shelf and in unboxing content, winning across every channel.',
    byChannel: [
      { channel: 'Instagram', winner: 'Packaging A', pct: 61 },
      { channel: 'Email', winner: 'Packaging A', pct: 56 },
      { channel: 'QR', winner: 'Packaging A', pct: 54 },
    ],
  },
  {
    id: 'shoe-packaging-02',
    campaignSlug: 'shoe-packaging',
    question: 'Which inner wrap should we use?',
    left: {
      label: 'Kraft Tissue',
      image: '/polsts/pkg-insert-kraft.png',
      votePct: 47,
    },
    right: {
      label: 'White Tissue',
      image: '/polsts/pkg-insert-white.png',
      votePct: 53,
    },
    winner: 'White Tissue',
    responses: 2890,
    status: 'Complete',
    channels: ['Instagram', 'Email'],
    whyItMattered:
      'Crisp white tissue with a sticker seal read as more premium and photographed better for unboxing.',
    byChannel: [
      { channel: 'Instagram', winner: 'White Tissue', pct: 55 },
      { channel: 'Email', winner: 'White Tissue', pct: 51 },
    ],
  },

  // --- Packaging Test ---
  {
    id: 'packaging-test-01',
    campaignSlug: 'packaging-test',
    question: 'Which box color tests best?',
    left: {
      label: 'Sunshine Yellow',
      image: '/polsts/pkgtest-a.png',
      votePct: 44,
    },
    right: {
      label: 'Crimson Red',
      image: '/polsts/pkgtest-b.png',
      votePct: 56,
    },
    winner: 'Crimson Red',
    responses: 1980,
    status: 'Draft',
    channels: ['Instagram', 'Email'],
    whyItMattered:
      'Crimson drove higher recall and stronger click intent than the yellow variant.',
    byChannel: [
      { channel: 'Instagram', winner: 'Crimson Red', pct: 58 },
      { channel: 'Email', winner: 'Crimson Red', pct: 53 },
    ],
  },
  {
    id: 'packaging-test-02',
    campaignSlug: 'packaging-test',
    question: 'Matte or glossy finish?',
    left: {
      label: 'Matte Finish',
      image: '/polsts/pkgtest-matte.png',
      votePct: 52,
    },
    right: {
      label: 'Glossy Finish',
      image: '/polsts/pkgtest-gloss.png',
      votePct: 48,
    },
    winner: 'Matte Finish',
    responses: 1604,
    status: 'Draft',
    channels: ['Instagram'],
    whyItMattered:
      'Matte felt more premium and reduced glare in product photography, edging out gloss.',
    byChannel: [{ channel: 'Instagram', winner: 'Matte Finish', pct: 52 }],
  },

  // --- Retail Display Test ---
  {
    id: 'retail-display-test-01',
    campaignSlug: 'retail-display-test',
    question: 'Which retail display concept performs best?',
    left: { label: 'Lime Wall', image: '/polsts/display-a.png', votePct: 48 },
    right: {
      label: 'Pink Podium',
      image: '/polsts/display-b.png',
      votePct: 52,
    },
    winner: 'Pink Podium',
    responses: 8420,
    status: 'Complete',
    channels: ['Website', 'QR'],
    whyItMattered:
      'The pink podium drew more dwell time and photo engagement than the wall layout in-store.',
    byChannel: [
      { channel: 'Website', winner: 'Pink Podium', pct: 53 },
      { channel: 'QR', winner: 'Pink Podium', pct: 51 },
    ],
  },
  {
    id: 'retail-display-test-02',
    campaignSlug: 'retail-display-test',
    question: 'Endcap or island placement?',
    left: {
      label: 'Aisle Endcap',
      image: '/polsts/display-endcap.png',
      votePct: 45,
    },
    right: {
      label: 'Center Island',
      image: '/polsts/display-island.png',
      votePct: 55,
    },
    winner: 'Center Island',
    responses: 6210,
    status: 'Complete',
    channels: ['QR'],
    whyItMattered:
      'The center island captured traffic from all directions and outperformed the endcap on scans.',
    byChannel: [{ channel: 'QR', winner: 'Center Island', pct: 55 }],
  },

  // --- Spring Tender Combo Test ---
  {
    id: 'spring-tender-combo-01',
    campaignSlug: 'spring-tender-combo',
    question: 'Which new tender combo would you order?',
    left: {
      label: 'Honey Butter Tenders',
      image: '/polsts/tenders-honey.png',
      votePct: 62,
    },
    right: {
      label: 'Spicy Buffalo Tenders',
      image: '/polsts/tenders-buffalo.png',
      votePct: 38,
    },
    winner: 'Honey Butter Tenders',
    responses: 215000,
    status: 'Complete',
    channels: ['App', 'Email', 'QR', 'Social'],
    whyItMattered:
      'Honey Butter was the clear hero, winning by 24 points and carrying the strongest price acceptance.',
    byChannel: [
      { channel: 'App', winner: 'Honey Butter Tenders', pct: 64 },
      { channel: 'Email', winner: 'Honey Butter Tenders', pct: 61 },
      { channel: 'QR', winner: 'Honey Butter Tenders', pct: 68 },
      { channel: 'Social', winner: 'Honey Butter Tenders', pct: 54 },
    ],
  },
  {
    id: 'spring-tender-combo-02',
    campaignSlug: 'spring-tender-combo',
    question: 'What side goes with it?',
    left: {
      label: 'Texas Toast & Gravy',
      image: '/polsts/side-toast.png',
      votePct: 54,
    },
    right: {
      label: 'Loaded Fries',
      image: '/polsts/side-fries.png',
      votePct: 46,
    },
    winner: 'Texas Toast & Gravy',
    responses: 206000,
    status: 'Complete',
    channels: ['App', 'Email', 'QR', 'Social'],
    whyItMattered:
      'Texas toast and gravy paired best with the honey butter hero and lifted perceived value.',
    byChannel: [
      { channel: 'App', winner: 'Texas Toast & Gravy', pct: 55 },
      { channel: 'Email', winner: 'Texas Toast & Gravy', pct: 53 },
      { channel: 'QR', winner: 'Texas Toast & Gravy', pct: 56 },
      { channel: 'Social', winner: 'Loaded Fries', pct: 51 },
    ],
  },
  {
    id: 'spring-tender-combo-03',
    campaignSlug: 'spring-tender-combo',
    question: 'Which drink completes the combo?',
    left: {
      label: 'Sweet Tea',
      image: '/polsts/drink-tea.png',
      votePct: 57,
    },
    right: {
      label: 'Strawberry Lemonade',
      image: '/polsts/drink-lemonade.png',
      votePct: 43,
    },
    winner: 'Sweet Tea',
    responses: 188000,
    status: 'Complete',
    channels: ['App', 'Email', 'QR', 'Social'],
    whyItMattered:
      'Sweet tea was the regional favorite and the safest default pairing for the combo.',
    byChannel: [
      { channel: 'App', winner: 'Sweet Tea', pct: 58 },
      { channel: 'Email', winner: 'Sweet Tea', pct: 56 },
      { channel: 'QR', winner: 'Sweet Tea', pct: 60 },
      { channel: 'Social', winner: 'Strawberry Lemonade', pct: 52 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Campaign report (full results) — modeled on a real Polst campaign export
// ---------------------------------------------------------------------------

export type ReportStat = { label: string; value: string; sub?: string }

export type ReportQuestion = {
  question: string
  responses: number
  options: { label: string; pct: number }[]
}

export type ReportChannel = {
  name: string
  voters: string
  completion: number
}

export type ReportSegment = {
  utm: string
  tag: string
  voters: string
  detail: string
}

export type ReportRecommendation = {
  category: string
  priority: 'High' | 'Medium' | 'Efficiency'
  title: string
  dataBasis: string
  rationale: string
}

export type CampaignReport = {
  title: string
  client: string
  generatedOn: string
  headline: string
  summary: string
  confidence: number
  overview: ReportStat[]
  keyResults: ReportQuestion[]
  channelPerformance: ReportChannel[]
  executiveSummary: string
  completedSessions: string
  marginOfError: string
  segmentation: ReportSegment[]
  recommendations: ReportRecommendation[]
  dataNotes?: string
}

export const campaignReports: Record<string, CampaignReport> = {
  'spring-tender-combo': {
    title: 'Spring Tender Combo Test',
    client: 'Chicken Express',
    generatedOn: 'April 29, 2026',
    headline: 'Honey Butter Tenders win 62/38',
    summary:
      'Honey Butter is the clear hero. Honey Butter voters accept the $9.99 price at 74% vs. 58% for Spicy Buffalo, and QR in-store guests showed the strongest buy signal. Launch Honey Butter as the LTO hero with Texas toast & gravy as the featured side.',
    confidence: 99,
    overview: [
      { label: 'Total Voters', value: '215K', sub: '+28% vs. Fall test' },
      { label: 'Completion Rate', value: '71%', sub: 'Industry avg: 48%' },
      { label: 'Avg. Time', value: '38s', sub: 'Per respondent' },
    ],
    keyResults: [
      {
        question: 'Which new tender combo would you order?',
        responses: 215000,
        options: [
          { label: 'Honey Butter Tenders', pct: 62 },
          { label: 'Spicy Buffalo Tenders', pct: 38 },
        ],
      },
      {
        question: 'What side goes with it?',
        responses: 206000,
        options: [
          { label: 'Texas toast & gravy', pct: 54 },
          { label: 'Loaded fries', pct: 46 },
        ],
      },
      {
        question: 'Would you pay $9.99 for the combo?',
        responses: 198000,
        options: [
          { label: 'Yes, fair price', pct: 68 },
          { label: 'Too much', pct: 32 },
        ],
      },
      {
        question: 'Limited time or permanent menu?',
        responses: 194000,
        options: [
          { label: 'Limited time (drives urgency)', pct: 58 },
          { label: 'Permanent (I want it always)', pct: 42 },
        ],
      },
      {
        question: 'Which drink completes the combo?',
        responses: 188000,
        options: [
          { label: 'Sweet tea', pct: 57 },
          { label: 'Strawberry lemonade', pct: 43 },
        ],
      },
    ],
    channelPerformance: [
      { name: 'App Push', voters: '82K', completion: 74 },
      { name: 'Email', voters: '64K', completion: 72 },
      { name: 'QR (In-Store)', voters: '42K', completion: 78 },
      { name: 'Social', voters: '27K', completion: 56 },
    ],
    executiveSummary:
      'Honey Butter wins 62/38. Cross-tab Q1×Q3: Honey Butter voters accept $9.99 at 74%, vs. 58% for Spicy Buffalo. Texas IPs show 71% Honey Butter preference. QR-store voters showed highest price acceptance (78%) and strongest Honey Butter preference (68%). Launch Honey Butter as the LTO hero with Texas toast & gravy as the featured side.',
    completedSessions: '152.7K voters',
    marginOfError: '±0.26%',
    segmentation: [
      {
        utm: 'app-push',
        tag: 'Highest Volume',
        voters: '82K voters',
        detail:
          'Q1: 64% Honey Butter. Q3: 72% accept $9.99. Q4: 61% LTO. Highest-volume, most decisive segment.',
      },
      {
        utm: 'qr-store',
        tag: 'Strongest Buy Signal',
        voters: '42K voters',
        detail:
          'Q1: 68% Honey Butter. Q3: 78% accept $9.99. In-store guests already primed to buy. Completion: 78%.',
      },
      {
        utm: 'social',
        tag: 'Price Sensitive',
        voters: '27K voters',
        detail:
          'Q1: 54/46 split. Q3: 52% accept $9.99 (lowest). Q4: 66% LTO. Curious but price-sensitive.',
      },
    ],
    recommendations: [
      {
        category: 'Menu Strategy',
        priority: 'High',
        title:
          'Launch Honey Butter Tenders as a 6-week LTO at $9.99 with Texas toast & gravy combo',
        dataBasis:
          'Q1 62% Honey Butter. Q3 cross-tab: HB voters accept $9.99 at 74%. Q4: HB voters prefer LTO at 64%. Q2: Texas toast wins at 54%.',
        rationale:
          'LTO format aligns with 64% preference among HB voters. Feature a $11.99 combo (tenders + toast + drink) as default; $9.99 a la carte as anchor. 6-week run with 2-week extension option if velocity stays above 80% of launch week.',
      },
      {
        category: 'Product Portfolio',
        priority: 'High',
        title: 'Add Spicy Buffalo Tenders to permanent menu at $8.49 as value anchor',
        dataBasis:
          'Buffalo voters accept $9.99 at only 58% but prefer permanent menu at 51%. Walk-in QR only channel where Buffalo leads (52%).',
        rationale:
          'At $8.49, Buffalo serves as value anchor making the $9.99 Honey Butter LTO feel premium. Drives weekday traffic; pairs with loaded fries (46% preference).',
      },
      {
        category: 'Operations',
        priority: 'Medium',
        title: 'Deploy QR loyalty capture at point-of-sale to convert high-intent voters',
        dataBasis:
          'QR-store: 78% price acceptance, 68% Honey Butter, 78% completion (all highest).',
        rationale:
          "Integrate QR flow with loyalty app. Projected capture: 35–45% of QR voters (~15–19K profiles). Offer 'early taste' access before official launch.",
      },
      {
        category: 'Channel Strategy',
        priority: 'Efficiency',
        title: 'Shift social budget from research to LTO launch amplification',
        dataBasis:
          'Social Q1 split 54/46 (weak signal), Q3 52% acceptance (lowest), but Q4 66% LTO preference (highest).',
        rationale:
          "Social voters are unreliable for product research but valuable for LTO buzz. Downweight in product decisions; pivot budget to 'limited time' launch content.",
      },
    ],
    dataNotes:
      'This report reflects responses collected through tracked POLST links, QR codes, embeds, and influencer URLs. Results are directional unless marked statistically significant.',
  },
}

export function getReport(slug: string): CampaignReport | undefined {
  return campaignReports[slug]
}

export function getCampaign(slug: string) {
  return campaigns.find((c) => c.slug === slug)
}

export function getPolstsForCampaign(slug: string) {
  return polsts.filter((p) => p.campaignSlug === slug)
}

export function getPolst(id: string) {
  return polsts.find((p) => p.id === id)
}

/** 1-based positional URL ref for a Polst, e.g. polst-1. */
export function polstRef(index: number) {
  return `polst-${index + 1}`
}

/**
 * Resolve a Polst within a campaign by its full id (holiday-creative-01) or a
 * friendly positional ref used in URLs (polst-1, polst-2, ...).
 */
export function getPolstByRef(campaignSlug: string, ref: string) {
  const list = getPolstsForCampaign(campaignSlug)
  const positional = ref.match(/^polst-(\d+)$/)
  if (positional) return list[Number(positional[1]) - 1]
  return list.find((p) => p.id === ref)
}

export function formatNumber(n: number) {
  return n.toLocaleString('en-US')
}
