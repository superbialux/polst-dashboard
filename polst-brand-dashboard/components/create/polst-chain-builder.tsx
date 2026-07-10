'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  Plus,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ChainPolst = {
  id: string
  question: string
  left: string
  right: string
}

const MAX = 5

const initial: ChainPolst[] = [
  {
    id: 'p1',
    question: 'Which holiday campaign should we run?',
    left: 'Classic Holiday',
    right: 'Modern Holiday',
  },
  {
    id: 'p2',
    question: 'Which headline should lead the holiday campaign?',
    left: 'Give More. Move More.',
    right: 'Built for the Season.',
  },
  {
    id: 'p3',
    question: 'Which landing page hero should we use?',
    left: 'Athlete Hero',
    right: 'Product Hero',
  },
]

let counter = 4

export function PolstChainBuilder() {
  const [polsts, setPolsts] = useState<ChainPolst[]>(initial)
  const [selectedId, setSelectedId] = useState('p1')

  const selected = polsts.find((p) => p.id === selectedId) ?? polsts[0]

  const update = (patch: Partial<ChainPolst>) =>
    setPolsts((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)),
    )

  const add = () => {
    if (polsts.length >= MAX) return
    const id = `p${counter++}`
    setPolsts((prev) => [
      ...prev,
      { id, question: 'New Polst question', left: 'Option A', right: 'Option B' },
    ])
    setSelectedId(id)
  }

  const duplicate = (id: string) => {
    if (polsts.length >= MAX) return
    const src = polsts.find((p) => p.id === id)
    if (!src) return
    const newId = `p${counter++}`
    const idx = polsts.findIndex((p) => p.id === id)
    setPolsts((prev) => {
      const next = [...prev]
      next.splice(idx + 1, 0, { ...src, id: newId })
      return next
    })
    setSelectedId(newId)
  }

  const remove = (id: string) => {
    if (polsts.length <= 1) return
    setPolsts((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(polsts[0].id)
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = polsts.findIndex((p) => p.id === id)
    const target = idx + dir
    if (target < 0 || target >= polsts.length) return
    setPolsts((prev) => {
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
      {/* Chain list */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Polsts in this Decision Campaign</p>
        <ol className="space-y-2">
          {polsts.map((p, i) => {
            const active = p.id === selected.id
            return (
              <li key={p.id}>
                <div
                  className={cn(
                    'rounded-xl border p-3 transition-colors',
                    active
                      ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className="flex w-full items-center gap-2.5 text-left"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.question}
                    </span>
                  </button>
                  <div className="mt-2 flex items-center gap-1 pl-9">
                    <button
                      onClick={() => move(p.id, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      onClick={() => move(p.id, 1)}
                      disabled={i === polsts.length - 1}
                      aria-label="Move down"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      onClick={() => duplicate(p.id)}
                      disabled={polsts.length >= MAX}
                      aria-label="Duplicate Polst"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={polsts.length <= 1}
                      aria-label="Remove Polst"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        <button
          onClick={add}
          disabled={polsts.length >= MAX}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add Another Polst
        </button>
        <p className="text-center text-xs text-muted-foreground">
          {polsts.length} of {MAX} Polsts
        </p>
      </div>

      {/* Selected builder */}
      <Card className="space-y-5 p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Question</label>
          <input
            value={selected.question}
            onChange={(e) => update({ question: e.target.value })}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-2">
            <button className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ImagePlus className="size-6" />
              <span className="text-xs font-medium">Upload image</span>
            </button>
            <input
              value={selected.left}
              onChange={(e) => update({ left: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
          <div className="flex items-center justify-center">
            <span className="grid size-12 place-items-center rounded-full border border-border bg-card text-sm font-extrabold uppercase tracking-wider text-foreground shadow-md">
              OR
            </span>
          </div>
          <div className="flex-1 space-y-2">
            <button className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ImagePlus className="size-6" />
              <span className="text-xs font-medium">Upload image</span>
            </button>
            <input
              value={selected.right}
              onChange={(e) => update({ right: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
