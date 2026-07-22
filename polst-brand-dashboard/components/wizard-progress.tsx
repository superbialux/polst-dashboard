import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_STEPS = ['Decision', 'Build Polst', 'Distribution', 'Review']

export function WizardProgress({
  current,
  steps = DEFAULT_STEPS,
}: {
  current: number
  steps?: string[]
}) {
  return (
    <ol className="flex w-full items-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done &&
                    !active &&
                    'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm font-medium sm:block',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-border')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
