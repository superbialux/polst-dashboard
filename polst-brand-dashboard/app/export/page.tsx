import type { Metadata } from 'next'
import { ExportDocument } from '@/components/export/export-document'
import { exportScreens } from '@/lib/screens'

export const metadata: Metadata = {
  title: 'Polst — Screen Export',
  description: 'A printable walkthrough of every screen in the Polst brand app.',
}

export default function ExportPage() {
  return <ExportDocument screens={exportScreens} />
}
