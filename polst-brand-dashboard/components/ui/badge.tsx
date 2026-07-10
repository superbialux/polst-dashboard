import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        live: 'border-transparent bg-success/12 text-success',
        draft: 'border-transparent bg-muted text-muted-foreground',
        complete: 'border-transparent bg-primary/10 text-primary',
        archived: 'border-border bg-transparent text-muted-foreground',
        accent: 'border-transparent bg-accent text-accent-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    Live: 'live',
    Active: 'live',
    Draft: 'draft',
    Paused: 'draft',
    Ready: 'accent',
    Invited: 'outline',
    Complete: 'complete',
    Archived: 'archived',
  }
  const dot = status === 'Live' || status === 'Active'
  return (
    <Badge variant={map[status] ?? 'default'} className="uppercase tracking-wide">
      {dot && <span className="size-1.5 rounded-full bg-success" />}
      {status}
    </Badge>
  )
}

export { Badge, badgeVariants }
