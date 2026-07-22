import { WizardProgress } from '@/components/wizard-progress'

export function WizardShell({
  step,
  steps,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number
  steps?: string[]
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const total = steps?.length ?? 4
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24 lg:pb-8">
      <WizardProgress current={step} steps={steps} />
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-primary">
          {eyebrow ?? `Step ${step} of ${total}`}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-pretty">{subtitle}</p>
        )}
      </div>

      <div>{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        {footer}
      </div>
    </div>
  )
}
