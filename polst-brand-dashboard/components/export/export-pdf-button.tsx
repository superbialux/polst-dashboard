import { FileDown } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

export function ExportPdfBar() {
  return (
    <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-8 text-center">
      <p className="text-sm text-muted-foreground">
        Need a shareable walkthrough? Export every screen with descriptions as a
        PDF.
      </p>
      <LinkButton href="/export" target="_blank" variant="outline" size="lg">
        <FileDown className="size-4" />
        Export PDF
      </LinkButton>
    </div>
  )
}
