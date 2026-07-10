import { cn } from '@/lib/utils'

/**
 * The iconic POLST "OR" divider that sits between the two visual options.
 * Horizontal on mobile (between stacked options), vertical (centered) on desktop.
 */
export function OrDivider({
  orientation = 'responsive',
  className,
}: {
  orientation?: 'responsive' | 'horizontal' | 'vertical'
  className?: string
}) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <OrBadge />
      </div>
    )
  }
  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <OrBadge />
      </div>
    )
  }
  // responsive: horizontal divider on mobile, vertical on desktop
  return (
    <div
      className={cn(
        'pointer-events-none flex items-center justify-center',
        className,
      )}
      aria-hidden="true"
    >
      <OrBadge />
    </div>
  )
}

function OrBadge() {
  return (
    <span className="grid size-12 place-items-center rounded-full border border-border bg-card text-sm font-extrabold uppercase tracking-wider text-foreground shadow-md">
      OR
    </span>
  )
}
