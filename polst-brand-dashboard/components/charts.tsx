import { cn } from '@/lib/utils'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function DonutChart({
  data,
  className,
  centerValue,
  centerLabel = 'tracked',
}: {
  data: { name: string; value: number }[]
  className?: string
  centerValue?: string
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
          {data.map((d, i) => {
            const fraction = d.value / total
            const dash = fraction * circumference
            const segment = (
              <circle
                key={d.name}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return segment
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight">
            {centerValue ?? `${total}%`}
          </span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarChart({
  data,
  className,
}: {
  data: { group: string; value: number }[]
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className={cn('flex items-end justify-between gap-3 pt-2', className)}>
      {data.map((d) => (
        <div key={d.group} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-foreground">
            {d.value}%
          </span>
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-t-md bg-primary/85 transition-all"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.group}</span>
        </div>
      ))}
    </div>
  )
}

export function HorizontalBars({
  data,
  className,
  suffix = '%',
}: {
  data: { label: string; value: number; sub?: string }[]
  className?: string
  suffix?: string
}) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {d.value.toLocaleString()}
              {suffix}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          {d.sub && (
            <span className="text-xs text-muted-foreground">{d.sub}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function AreaLine({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  const w = 320
  const h = 120
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 16) - 8
    return [x, y] as const
  })
  const line = points.map((p) => `${p[0]},${p[1]}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-32 w-full', className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
