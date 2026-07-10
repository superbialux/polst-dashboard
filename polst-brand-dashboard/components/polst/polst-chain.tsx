import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type PolstChainStep = {
  question: string
  options: { label: string; pct: number }[]
}

export function PolstChain({
  steps,
  title = 'The Polst Chain',
  subtitle,
}: {
  steps: PolstChainStep[]
  title?: string
  subtitle?: string
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {subtitle ??
            `${steps.length} questions answered in sequence — each option shown left or right.`}
        </p>
      </div>
      <Card className="p-4 sm:p-5">
        <ol className="relative space-y-3">
          {steps.map((step, i) => {
            const winning = Math.max(...step.options.map((o) => o.pct))
            const isLast = i === steps.length - 1
            return (
              <li key={step.question} className="flex gap-3">
                {/* Step rail */}
                <div className="flex flex-col items-center">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>

                {/* Step body */}
                <div className="min-w-0 flex-1 pb-1">
                  <p className="truncate text-sm font-medium" title={step.question}>
                    {step.question}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {step.options.map((o, idx) => {
                      const isWinner = o.pct === winning
                      return (
                        <span key={o.label} className="flex items-center gap-1.5">
                          {idx > 0 && (
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">
                              or
                            </span>
                          )}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
                              isWinner
                                ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                                : 'border-border text-muted-foreground',
                            )}
                          >
                            {isWinner && <Check className="size-3" />}
                            <span className="max-w-40 truncate">{o.label}</span>
                            <span className="tabular-nums">{o.pct}%</span>
                          </span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>
    </section>
  )
}
