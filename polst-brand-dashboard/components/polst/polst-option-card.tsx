import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PolstOption } from '@/lib/data'

/**
 * A single visual option within a Polst (one side of the OR).
 * Shows the creative image, an option headline, vote percentage and an
 * animated vote bar. Winning options get a trophy badge and accent ring.
 */
export function PolstOptionCard({
  option,
  isWinner,
  votes,
  size = 'default',
}: {
  option: PolstOption
  isWinner: boolean
  /** Vote count for this option, if available */
  votes?: number
  size?: 'default' | 'compact'
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-1 flex-col overflow-hidden rounded-xl border bg-card transition-colors',
        isWinner ? 'border-primary ring-1 ring-primary/40' : 'border-border',
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden bg-muted',
          size === 'compact' ? 'aspect-[4/3]' : 'aspect-square sm:aspect-[4/3]',
        )}
      >
        <Image
          src={option.image || '/placeholder.svg'}
          alt={option.label}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {isWinner &&
          (size === 'compact' ? (
            <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Trophy className="size-3" />
              <span className="sr-only">Winner</span>
            </span>
          ) : (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              <Trophy className="size-3" />
              Winner
            </span>
          ))}
      </div>

      <div className={cn('flex flex-col gap-2', size === 'compact' ? 'p-3' : 'p-4')}>
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'font-semibold leading-tight text-balance',
              size === 'compact' ? 'text-sm' : 'text-base',
            )}
          >
            {option.label}
          </p>
          <span
            className={cn(
              'shrink-0 font-bold tabular-nums',
              isWinner ? 'text-primary' : 'text-foreground',
              size === 'compact' ? 'text-base' : 'text-xl',
            )}
          >
            {option.votePct}%
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              'h-full rounded-full',
              isWinner ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            style={{ width: `${option.votePct}%` }}
          />
        </div>

        {typeof votes === 'number' && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {votes.toLocaleString('en-US')} votes
          </p>
        )}
      </div>
    </div>
  )
}
