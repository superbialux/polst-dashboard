import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RecommendationItem({
  title,
  detail,
  href,
}: {
  title: string
  detail?: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        {detail && (
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
      <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

export function RecommendationList({
  items,
  href,
  className,
}: {
  items: { title: string; detail?: string }[]
  href: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((item) => (
        <RecommendationItem
          key={item.title}
          title={item.title}
          detail={item.detail}
          href={href}
        />
      ))}
    </div>
  )
}
