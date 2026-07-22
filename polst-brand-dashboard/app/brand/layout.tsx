import { AppShell } from '@/components/app-shell'
import { ExportPdfBar } from '@/components/export/export-pdf-button'

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      {children}
      <ExportPdfBar />
    </AppShell>
  )
}
