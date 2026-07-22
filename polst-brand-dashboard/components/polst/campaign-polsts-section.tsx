import { LayoutGrid } from 'lucide-react'
import { PolstPreviewCard } from '@/components/polst/polst-preview-card'
import type { Polst } from '@/lib/data'

/**
 * The mandatory "Polsts in this Decision Campaign" section. Surfaces the actual
 * visual Polsts before any analytics so the user always sees what was asked.
 */
export function CampaignPolstsSection({
  polsts,
  title = 'Polsts in this Decision Campaign',
  subtitle = 'These are the visual Polsts used to answer the decision.',
}: {
  polsts: Polst[]
  title?: string
  subtitle?: string
}) {
  if (polsts.length === 0) return null
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <LayoutGrid className="size-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {polsts.map((p, i) => (
          <PolstPreviewCard key={p.id} polst={p} index={i} compact />
        ))}
      </div>
    </section>
  )
}
