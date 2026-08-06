import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FormFrameworkProvider, useFormFramework } from '@/components/form-framework/context'
import { FormActionBar } from '@/components/form-framework/FormActionBar'
import type { FormFrameworkConfig, SaveState } from '@/components/form-framework/types'
import './qa-globals.css'

const STEPS: FormFrameworkConfig['steps'] = [
  { id: 'identity', title: 'Basic Info', displayTitle: 'Identity & Governance', requiredCount: 6, completion: 12 },
  { id: 'location', title: 'Location', displayTitle: 'Location & Zoning', requiredCount: 1, completion: 30 },
  { id: 'financial', title: 'Pricing', displayTitle: 'Pricing & Terms', requiredCount: 1, completion: 42 },
  { id: 'size', title: 'Size & Structure', displayTitle: 'Size, Rooms & Structure', requiredCount: 1, completion: 48 },
  { id: 'construction', title: 'Construction', displayTitle: 'Construction Systems', requiredCount: 0, completion: 55 },
  { id: 'outdoor', title: 'Outdoor', displayTitle: 'Outdoor & Amenities', requiredCount: 0, completion: 65 },
  { id: 'media', title: 'Media', displayTitle: 'Marketing & Media', requiredCount: 0, completion: 85 },
  { id: 'review', title: 'Review', displayTitle: 'Review', requiredCount: 0, completion: 100 },
]

const config: FormFrameworkConfig = {
  title: 'New Property',
  entityLabel: 'Property',
  steps: STEPS,
  totalPhasesCount: STEPS.length,
}

const fakeForm = {
  trigger: async () => true,
  getValues: () => ({}),
  formState: { errors: {}, isDirty: false },
} as any

const panelBtn: React.CSSProperties = {
  font: '11px ui-monospace, monospace',
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#eee',
  cursor: 'pointer',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ font: '10px ui-monospace, monospace', color: '#888', width: 78 }}>{label}</span>
      {children}
    </div>
  )
}

function HarnessBody() {
  const ctx = useFormFramework()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const setSave = (s: SaveState) => ctx.setSaveState(s)

  const toggleSubmitting = () => { const v = !submitting; setSubmitting(v); ctx._setIsSubmitting(v) }
  const toggleSuccess = () => { const v = !success; setSuccess(v); ctx._setIsSubmitSuccess(v) }

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#111', padding: '10px 12px', display: 'flex',
          flexDirection: 'column', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,.4)',
        }}
      >
        <Row label="step">
          <button style={panelBtn} onClick={() => ctx.goToStep(0)}>1 · first</button>
          <button style={panelBtn} onClick={() => ctx.goToStep(3)}>4 · mid</button>
          <button style={panelBtn} onClick={() => ctx.goToStep(STEPS.length - 1)}>8 · last</button>
          <span style={{ color: '#666', font: '10px monospace' }}>current: {ctx.currentStepIndex + 1}/{STEPS.length}</span>
        </Row>
        <Row label="autosave">
          <button style={panelBtn} onClick={() => setSave({ status: 'idle' })}>idle</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'saving' })}>saving…</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'saving_draft' })}>syncing…</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'saved', savedAt: new Date() })}>saved just now</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'autosaved', savedAt: new Date(Date.now() - 20_000) })}>saved 20 sec ago</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'saved', savedAt: new Date(Date.now() - 2 * 60_000) })}>saved 2 min ago</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'failed', error: 'Network error' })}>failed</button>
          <button style={panelBtn} onClick={() => setSave({ status: 'unsaved' })}>unsaved</button>
        </Row>
        <Row label="network">
          <button style={panelBtn} onClick={() => window.dispatchEvent(new Event('offline'))}>go offline</button>
          <button style={panelBtn} onClick={() => window.dispatchEvent(new Event('online'))}>go online</button>
        </Row>
        <Row label="cta state">
          <button style={panelBtn} onClick={toggleSubmitting}>toggle submitting ({String(submitting)})</button>
          <button style={panelBtn} onClick={toggleSuccess}>toggle success ({String(success)})</button>
        </Row>
      </div>

      <div style={{ paddingTop: 168 }}>
        <div style={{ minHeight: '150vh', padding: '32px 24px', font: '14px/1.6 system-ui, sans-serif', color: '#334' }}>
          <h1 style={{ font: '600 20px system-ui' }}>Scroll stage — content behind the sticky footer</h1>
          <p>This tall block exists purely so the sticky footer has page content to separate itself from (elevation/shadow check).</p>
          {Array.from({ length: 24 }).map((_, i) => <p key={i}>Filler paragraph {i + 1} — lorem ipsum dolor sit amet.</p>)}
        </div>
        <FormActionBar onSubmit={() => {}} onCancel={() => {}} />
      </div>
    </>
  )
}

function Harness() {
  return (
    <FormFrameworkProvider config={config} callbacks={{ form: fakeForm, onSubmit: async () => {} }}>
      <HarnessBody />
    </FormFrameworkProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
