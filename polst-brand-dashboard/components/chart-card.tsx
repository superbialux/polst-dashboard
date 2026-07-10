import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ChartWithMeaning: every chart in the product is wrapped with a title and a
 * one-sentence, plain-language interpretation so a chart never stands alone.
 */
export function ChartCard({
  title,
  icon: Icon,
  interpretation,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  interpretation: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="size-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
          {interpretation}
        </p>
      </CardContent>
    </Card>
  )
}
