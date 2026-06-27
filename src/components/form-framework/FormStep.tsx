'use client'

import type { FormStepProps } from './types'

/**
 * Marker component — wraps the fields for one step.
 * FormFramework reads `.props.id` and `.props.children`
 * to determine which content to render for the current step.
 * Do not add layout logic here; all card/animation wrappers
 * live in FormFramework.
 */
export function FormStep({ children }: FormStepProps) {
  return <>{children}</>
}

FormStep.displayName = 'FormStep'
