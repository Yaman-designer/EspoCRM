'use client'

import { CRMResourcePage } from '@/components/crud/CRMResourcePage'
import { pipelineConfig } from '@/features/pipeline/config'

export function PipelineClient() {
  return <CRMResourcePage config={pipelineConfig} />
}
