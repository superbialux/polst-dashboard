'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CopyField({
  value,
  mono = false,
}: {
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary p-1.5 pl-3">
      <span
        className={cn(
          'flex-1 truncate text-sm text-foreground',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-success" />
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
  )
}
