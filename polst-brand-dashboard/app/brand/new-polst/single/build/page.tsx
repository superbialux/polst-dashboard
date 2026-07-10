'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ImagePlus } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { Card } from '@/components/ui/card'

const STEPS = ['Decision', 'Build', 'Distribution', 'Review']

function OptionBuilder({
  side,
  label,
  onLabel,
}: {
  side: string
  label: string
  onLabel: (v: string) => void
}) {
  return (
    <Card className="flex-1 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {side}
      </p>
      <button className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
        <ImagePlus className="size-6" />
        <span className="text-xs font-medium">Upload image</span>
      </button>
      <div className="mt-3 space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Option label
        </label>
        <input
          value={label}
          onChange={(e) => onLabel(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>
    </Card>
  )
}

export default function SingleBuildPage() {
  const [question, setQuestion] = useState(
    'Which package design should we use?',
  )
  const [left, setLeft] = useState('Package A')
  const [right, setRight] = useState('Package B')

  return (
    <WizardShell
      step={2}
      steps={STEPS}
      title="Build Your Polst"
      subtitle="Create one visual this-or-that question."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/single/decision"
            >
              <ArrowLeft className="size-4" />
              Back
            </LinkButton>
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/decision-campaigns"
            >
              Save Draft
            </LinkButton>
          </div>
          <LinkButton size="lg" href="/brand/new-polst/single/distribution">
            Continue
            <ArrowRight className="size-4" />
          </LinkButton>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="question" className="text-sm font-medium">
            Question
          </label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <OptionBuilder side="Left Option" label={left} onLabel={setLeft} />
          <div className="flex items-center justify-center">
            <span className="grid size-12 place-items-center rounded-full border border-border bg-card text-sm font-extrabold uppercase tracking-wider text-foreground shadow-md">
              OR
            </span>
          </div>
          <OptionBuilder side="Right Option" label={right} onLabel={setRight} />
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <Card className="space-y-4 p-5">
            <p className="text-pretty text-base font-semibold">{question}</p>
            <div className="flex items-center gap-2">
              <span className="grid flex-1 place-items-center rounded-lg border border-border bg-secondary/50 py-6 text-sm font-medium">
                {left || 'Option A'}
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-xs font-extrabold uppercase text-foreground shadow-sm">
                or
              </span>
              <span className="grid flex-1 place-items-center rounded-lg border border-border bg-secondary/50 py-6 text-sm font-medium">
                {right || 'Option B'}
              </span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-1 pt-1 text-center">
          <p className="text-sm text-muted-foreground">
            Need more questions?{' '}
            <Link
              href="/brand/new-polst/campaign/build"
              className="font-medium text-primary hover:underline"
            >
              Convert to Decision Campaign
            </Link>
          </p>
        </div>
      </div>
    </WizardShell>
  )
}
