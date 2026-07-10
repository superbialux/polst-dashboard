import { Copy, MessagesSquare, Share2, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { PolstOptionCard } from '@/components/polst/polst-option-card'
import { OrDivider } from '@/components/polst/or-divider'
import { type Polst, formatNumber, polstRef } from '@/lib/data'

/**
 * The hero POLST object: question, two large visual options separated by the
 * iconic OR divider, vote split, winner, responses, channels and actions.
 * This is the canonical representation of a Polst across the product.
 */
export function PolstPreviewCard({
  polst,
  index,
  compact = false,
}: {
  polst: Polst
  index?: number
  /** Mini variant for report/recap lists: smaller images, condensed meta, no actions. */
  compact?: boolean
}) {
  const base = `/brand/decision-campaigns/${polst.campaignSlug}`
  const detail =
    typeof index === 'number'
      ? `${base}/polsts/${polstRef(index)}`
      : `${base}/polsts/${polst.id}`
  const leftWins = polst.left.votePct >= polst.right.votePct
  const totalVotes = polst.responses

  if (compact) {
    const options = [polst.left, polst.right]
    const winningPct = Math.max(polst.left.votePct, polst.right.votePct)
    return (
      <Card>
        <CardHeader className="gap-1">
          {typeof index === 'number' && (
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Polst {index + 1}
            </span>
          )}
          <CardTitle className="text-base leading-snug text-pretty">
            {polst.question}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatNumber(polst.responses)} responses
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {options.map((o) => {
            const isWinner = o.votePct === winningPct
            return (
              <div key={o.label} className="flex items-center gap-3">
                <img
                  src={o.image || '/placeholder.svg'}
                  alt={o.label}
                  className="size-11 shrink-0 rounded-md object-cover ring-1 ring-border"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span
                      className={
                        isWinner
                          ? 'truncate font-semibold text-foreground'
                          : 'truncate text-muted-foreground'
                      }
                    >
                      {o.label}
                    </span>
                    <span
                      className={
                        isWinner
                          ? 'font-semibold text-primary'
                          : 'text-muted-foreground'
                      }
                    >
                      {o.votePct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={
                        isWinner ? 'h-full bg-primary' : 'h-full bg-border'
                      }
                      style={{ width: `${o.votePct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-border bg-secondary/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {typeof index === 'number' && <span>Polst {index + 1}</span>}
          </div>
          <StatusBadge status={polst.status} />
        </div>
        <h3 className="text-pretty text-lg font-semibold tracking-tight">
          {polst.question}
        </h3>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <PolstOptionCard
            option={polst.left}
            isWinner={leftWins}
            votes={Math.round((polst.left.votePct / 100) * totalVotes)}
          />
          <OrDivider className="shrink-0 sm:px-1" />
          <PolstOptionCard
            option={polst.right}
            isWinner={!leftWins}
            votes={Math.round((polst.right.votePct / 100) * totalVotes)}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Trophy className="size-4" />
            Winner: {polst.winner}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MessagesSquare className="size-4" />
            {formatNumber(polst.responses)} responses
          </span>
          <span className="text-muted-foreground">
            Channels: {polst.channels.join(', ')}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <LinkButton size="sm" href={detail}>
            View Details
          </LinkButton>
          <LinkButton size="sm" variant="outline" href={`${base}/distribution`}>
            <Share2 className="size-4" />
            Distribution Assets
          </LinkButton>
          <LinkButton size="sm" variant="ghost" href="/brand/new-polst/single/build">
            <Copy className="size-4" />
            Duplicate Polst
          </LinkButton>
        </div>
      </div>
    </Card>
  )
}
