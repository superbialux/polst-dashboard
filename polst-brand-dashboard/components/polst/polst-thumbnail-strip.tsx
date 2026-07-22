import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Polst } from '@/lib/data'

/**
 * A horizontal strip of small left/right option thumbnails for each Polst in a
 * Decision Campaign. Used on campaign list cards so the actual creative is
 * always visible, never text-only.
 */
export function PolstThumbnailStrip({
  polsts,
  className,
}: {
  polsts: Polst[]
  className?: string
}) {
  if (polsts.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {polsts.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1"
          title={p.question}
        >
          <Thumb src={p.left.image} alt={p.left.label} />
          <span className="px-0.5 text-[10px] font-bold uppercase text-muted-foreground">
            or
          </span>
          <Thumb src={p.right.image} alt={p.right.label} />
        </div>
      ))}
    </div>
  )
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative size-10 overflow-hidden rounded-md bg-muted">
      <Image
        src={src || '/placeholder.svg'}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
      />
    </div>
  )
}
