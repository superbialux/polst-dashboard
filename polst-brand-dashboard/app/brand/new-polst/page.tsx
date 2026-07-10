import Link from 'next/link'
import { ArrowRight, Layers, Square } from 'lucide-react'

const single = {
  title: 'Create Single Polst',
  description:
    'Ask one visual this-or-that question and create tracked assets for your channels.',
  bestFor: [
    'Quick creative test',
    'Product A/B',
    'Headline choice',
    'Menu item',
    'Social reaction',
  ],
  cta: 'Start Single Polst',
  href: '/brand/new-polst/single/decision',
}

const campaign = {
  title: 'Create Decision Campaign',
  description:
    'Chain up to 5 Polsts in sequence around one business decision and review the combined recommendation.',
  bestFor: [
    'Campaign creative',
    'Product launch',
    'Packaging decision',
    'Sponsorship activation',
    'Influencer comparison',
  ],
  cta: 'Start Decision Campaign',
  href: '/brand/new-polst/campaign/decision',
}

function MiniPolst() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 p-4">
      <span className="h-14 flex-1 rounded-lg bg-card shadow-sm ring-1 ring-border" />
      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card text-[10px] font-extrabold uppercase tracking-wider text-foreground shadow-sm">
        or
      </span>
      <span className="h-14 flex-1 rounded-lg bg-card shadow-sm ring-1 ring-border" />
    </div>
  )
}

function MiniChain() {
  return (
    <div className="relative flex flex-col gap-1.5 rounded-xl border border-border bg-secondary/50 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {i + 1}
          </span>
          <span className="h-5 flex-1 rounded-md bg-card shadow-sm ring-1 ring-border" />
          <span className="text-[9px] font-bold uppercase text-muted-foreground">
            or
          </span>
          <span className="h-5 flex-1 rounded-md bg-card shadow-sm ring-1 ring-border" />
        </div>
      ))}
    </div>
  )
}

function CreateTypeCard({
  data,
  visual,
}: {
  data: typeof single
  visual: React.ReactNode
}) {
  return (
    <Link
      href={data.href}
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      {visual}
      <h2 className="mt-5 text-lg font-semibold tracking-tight">{data.title}</h2>
      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
        {data.description}
      </p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Best for
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.bestFor.map((b) => (
            <span
              key={b}
              className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
      <span className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
        {data.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export default function NewPolstChoicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-primary">Create a Polst</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          What do you want to create?
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
          A Polst campaign can be a single Polst for a quick decision, or a
          chain of up to 5 Polsts in sequence that answer one larger business
          question.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CreateTypeCard
          data={single}
          visual={
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                <Square className="size-3.5" />
                One Polst
              </span>
              <MiniPolst />
            </div>
          }
        />
        <CreateTypeCard
          data={campaign}
          visual={
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                <Layers className="size-3.5" />
                2–5 Polsts
              </span>
              <MiniChain />
            </div>
          }
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        You can always start with one Polst and add more later. A Polst chain
        runs up to 5 Polsts in sequence.
      </p>
    </div>
  )
}
