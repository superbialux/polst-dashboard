'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { PolstLogo } from '@/components/polst-logo'
import { Button } from '@/components/ui/button'
import type { ExportScreen } from '@/lib/screens'

export function ExportDocument({ screens }: { screens: ExportScreen[] }) {
  const generatedOn = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-svh bg-muted text-foreground">
      {/* Screen-only toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
        <Link
          href="/brand/home"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to app
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
        <article className="print-sheet rounded-xl bg-card p-6 shadow-sm sm:p-10">
          {/* Cover */}
          <header className="mb-8 border-b border-border pb-8">
            <PolstLogo />
            <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Product Walkthrough
            </h1>
            <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              Every screen in the Polst brand experience, with a description of
              what it does and how it fits into the decision-campaign workflow.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Screens
                </p>
                <p className="font-medium">{screens.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Generated
                </p>
                <p className="font-medium">{generatedOn}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Document
                </p>
                <p className="font-medium">Confidential — Polst Enterprise</p>
              </div>
            </div>
          </header>

          {/* Screens */}
          <div className="space-y-10">
            {screens.map((screen, i) => (
              <section key={screen.id} className="export-screen">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {screen.group}
                    </p>
                    <h2 className="text-pretty text-xl font-semibold tracking-tight">
                      {screen.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  {screen.description}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {screen.route}
                </p>

                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={screen.image || '/placeholder.svg'}
                    alt={`${screen.title} screen`}
                    width={1280}
                    height={900}
                    className="h-auto w-full"
                    loading="eager"
                    unoptimized
                  />
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
            Confidential — Polst Enterprise · Generated {generatedOn}
          </footer>
        </article>
      </div>
    </div>
  )
}
