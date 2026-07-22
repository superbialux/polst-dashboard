import { Lightbulb, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PolstOptionCard } from '@/components/polst/polst-option-card'
import { OrDivider } from '@/components/polst/or-divider'
import { type Polst, formatNumber } from '@/lib/data'

/**
 * Compact result view of a Polst used on the Insights screen. Keeps the
 * iconic question + OR layout but adds a "Why it mattered" rationale.
 */
export function PolstResultCard({ polst }: { polst: Polst }) {
  const leftWins = polst.left.votePct >= polst.right.votePct

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <h3 className="text-pretty text-base font-semibold tracking-tight">
            {polst.question}
          </h3>
          <div className="mt-4 flex items-stretch gap-2">
            <PolstOptionCard
              option={polst.left}
              isWinner={leftWins}
              size="compact"
            />
            <OrDivider className="shrink-0" />
            <PolstOptionCard
              option={polst.right}
              isWinner={!leftWins}
              size="compact"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="space-y-2">
            <VoteRow
              label={polst.left.label}
              pct={polst.left.votePct}
              win={leftWins}
            />
            <VoteRow
              label={polst.right.label}
              pct={polst.right.votePct}
              win={!leftWins}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              <Trophy className="size-4" />
              {polst.winner}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(polst.responses)} responses
            </span>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-secondary p-3">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why it mattered
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {polst.whyItMattered}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function VoteRow({
  label,
  pct,
  win,
}: {
  label: string
  pct: number
  win: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className={win ? 'font-semibold' : 'text-muted-foreground'}>
          {label}
        </span>
        <span
          className={
            win
              ? 'font-bold tabular-nums text-primary'
              : 'font-medium tabular-nums text-muted-foreground'
          }
        >
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={win ? 'h-full rounded-full bg-primary' : 'h-full rounded-full bg-muted-foreground/40'}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
