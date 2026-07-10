import { cn } from '@/lib/utils'

export function PolstMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn('size-5', className)}
      aria-hidden="true"
    >
      <path d="M8.64.38h-4.45v4.89h2.41v-2.69h2.02c1.65,0,2.52.89,2.52,2.59s-.87,2.59-2.52,2.59h-4.43v4.12h2.41v-1.96h2.11c2.89,0,4.84-1.91,4.84-4.75,0-3-1.83-4.79-4.91-4.79" />
      <path d="M5.4,12.75c-.83,0-1.5.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5" />
    </svg>
  )
}

export function PolstLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <PolstMark className={markClassName} />
      {wordmark && (
        <span className="text-[1.05rem] font-semibold tracking-tight">
          Polst
        </span>
      )}
    </span>
  )
}
