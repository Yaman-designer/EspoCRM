import type { Metadata } from 'next'
import { PipelineClient } from './PipelineClient'

export const metadata: Metadata = { title: 'Pipeline' }

export default function PipelinePageRoute() {
  return <PipelineClient />
}
