export type ExportScreen = {
  id: string
  title: string
  group: string
  route: string
  image: string
  description: string
}

/**
 * Catalog of every screen in the Polst brand app, used to generate the
 * "Export PDF" document. Each entry pairs a captured screenshot with a
 * plain-language description of what the screen does.
 */
export const exportScreens: ExportScreen[] = [
  {
    id: 'home',
    title: 'Home',
    group: 'Overview',
    route: '/brand/home',
    image: '/exports/home.png',
    description:
      'The brand command center. Shows portfolio-level decision activity, recent recommendations, and recent Decision Campaigns. The primary action is + New Polst, which opens the choice between creating a Single Polst or a Decision Campaign.',
  },
  {
    id: 'decision-campaigns',
    title: 'Decision Campaigns',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns',
    image: '/exports/decision-campaigns.png',
    description:
      'The master list of every decision the brand is testing. Each card shows the business decision, Polsts used, response volume, channels, status, and current winning direction.',
  },
  {
    id: 'overview',
    title: 'Campaign Overview',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/holiday-creative/overview',
    image: '/exports/overview.png',
    description:
      'The results dashboard for a single Decision Campaign. Leads with metrics, then shows the actual visual Polsts in the chain before analytics.',
  },
  {
    id: 'insights',
    title: 'Insights & Recommendation',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/holiday-creative/insights',
    image: '/exports/insights.png',
    description:
      'The AI-generated recommendation view. Summarizes the winning direction with a confidence score, lays out the full Polst chain that produced it, and lists key findings the team can act on directly.',
  },
  {
    id: 'report',
    title: 'Full Campaign Report',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/spring-tender-combo/insights',
    image: '/exports/report.png',
    description:
      'A complete, client-ready campaign report. Includes the campaign overview, the full Polst question chain, detailed key results, channel performance, an executive summary with margin of error, response segmentation by source, and prioritized strategic recommendations.',
  },
  {
    id: 'distribution',
    title: 'Distribution Assets',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/holiday-creative/distribution',
    image: '/exports/distribution.png',
    description:
      'Where the team collects tracked assets to distribute a Single Polst or Decision Campaign. POLST creates links, QR codes, embeds, and influencer links, but never posts externally on the brand’s behalf.',
  },
  {
    id: 'influencers',
    title: 'Influencer Tracking',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/holiday-creative/influencers',
    image: '/exports/influencers.png',
    description:
      'Tracks performance of unique influencer links. Each creator has a tracked link with reach, responses, and click-through rate so the brand can attribute response volume to specific partners.',
  },
  {
    id: 'polst-detail',
    title: 'Polst Detail',
    group: 'Decision Campaigns',
    route: '/brand/decision-campaigns/holiday-creative/polsts/polst-1',
    image: '/exports/polst-detail.png',
    description:
      'A deep dive on a single Polst question. Renders the classic “this OR that” matchup with the winning option, then breaks the result down by channel and by referrer/source, with a plain-language note on why the result mattered.',
  },
  {
    id: 'new-choice',
    title: 'New Polst — Choose Type',
    group: 'Create a Polst',
    route: '/brand/new-polst',
    image: '/exports/new-choice.png',
    description:
      'Lets the user choose whether to create a Single Polst or a Decision Campaign.',
  },
  {
    id: 'single-decision',
    title: 'Single Polst — Decision',
    group: 'Create a Polst',
    route: '/brand/new-polst/single/decision',
    image: '/exports/single-decision.png',
    description:
      'Frames the business decision behind a standalone Polst.',
  },
  {
    id: 'single-build',
    title: 'Single Polst — Build',
    group: 'Create a Polst',
    route: '/brand/new-polst/single/build',
    image: '/exports/single-build.png',
    description:
      'Builds one visual this-or-that Polst with two options and an OR divider.',
  },
  {
    id: 'single-distribution',
    title: 'Single Polst — Distribution',
    group: 'Create a Polst',
    route: '/brand/new-polst/single/distribution',
    image: '/exports/single-distribution.png',
    description:
      'Selects where the Single Polst will be distributed and tracked.',
  },
  {
    id: 'single-review',
    title: 'Single Polst — Review',
    group: 'Create a Polst',
    route: '/brand/new-polst/single/review',
    image: '/exports/single-review.png',
    description:
      'Reviews the Single Polst before creating tracked assets.',
  },
  {
    id: 'campaign-decision',
    title: 'Decision Campaign — Decision',
    group: 'Create a Polst',
    route: '/brand/new-polst/campaign/decision',
    image: '/exports/campaign-decision.png',
    description:
      'Frames the larger business decision and names the Decision Campaign.',
  },
  {
    id: 'campaign-build',
    title: 'Decision Campaign — Build Chain',
    group: 'Create a Polst',
    route: '/brand/new-polst/campaign/build',
    image: '/exports/campaign-build.png',
    description:
      'Builds a chain of up to 5 Polsts tied to one decision.',
  },
  {
    id: 'campaign-distribution',
    title: 'Decision Campaign — Distribution',
    group: 'Create a Polst',
    route: '/brand/new-polst/campaign/distribution',
    image: '/exports/campaign-distribution.png',
    description:
      'Selects channels and asset scope for the full Decision Campaign or specific starting Polsts.',
  },
  {
    id: 'campaign-review',
    title: 'Decision Campaign — Review',
    group: 'Create a Polst',
    route: '/brand/new-polst/campaign/review',
    image: '/exports/campaign-review.png',
    description:
      'Reviews the decision, Polst chain, selected channels, and estimated reach before creating assets.',
  },
  {
    id: 'new-success',
    title: 'Polst Assets Created',
    group: 'Create a Polst',
    route: '/brand/new-polst/success',
    image: '/exports/new-success.png',
    description:
      'Confirms that assets were created and gives the user links, QR, embed code, and next actions.',
  },
  {
    id: 'audience',
    title: 'Audience',
    group: 'Insights',
    route: '/brand/audience',
    image: '/exports/audience.png',
    description:
      'The brand’s aggregate audience view. Visualizes who is responding across all campaigns — demographics, top topics of interest, and engagement patterns that inform future targeting.',
  },
  {
    id: 'team',
    title: 'Team',
    group: 'Settings',
    route: '/brand/team',
    image: '/exports/team.png',
    description:
      'Team management. Lists members with their roles and access levels and provides controls to invite new collaborators to the workspace.',
  },
  {
    id: 'settings',
    title: 'Settings',
    group: 'Settings',
    route: '/brand/settings',
    image: '/exports/settings.png',
    description:
      'Workspace settings. Covers organization profile, notification preferences for campaign results and weekly summaries, and other account-level configuration.',
  },
]
