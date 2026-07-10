'use client'

import { useState } from 'react'
import { Check, Code, Copy, QrCode } from 'lucide-react'
import { Card } from '@/components/ui/card'

const SHARE_LINK = 'https://polst.app/p/holiday-creative'
const EMBED_CODE = '<script src="https://polst.app/embed/holiday-creative.js"></script>'

function CopyRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground">
          {value}
        </code>
        <button
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-accent/60"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-primary" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export function SuccessAssetPanel() {
  return (
    <Card className="space-y-5 p-5">
      <CopyRow
        label="Share link"
        value={SHARE_LINK}
        icon={<Copy className="size-3.5" />}
      />
      <CopyRow
        label="Embed code"
        value={EMBED_CODE}
        icon={<Code className="size-3.5" />}
      />
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <QrCode className="size-3.5" />
          QR code
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/60">
          <QrCode className="size-4" />
          Download QR
        </button>
      </div>
    </Card>
  )
}
