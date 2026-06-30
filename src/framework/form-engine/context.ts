import { createContext } from 'react'
import type { DynamicFormContextValue } from './types'

export const DynamicFormContext = createContext<DynamicFormContextValue | null>(null)
