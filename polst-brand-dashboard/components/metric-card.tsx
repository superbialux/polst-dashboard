import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  className,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  accent?: boolean
  className?: string
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              'grid size-8 place-items-center rounded-lg',
              accent
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}
