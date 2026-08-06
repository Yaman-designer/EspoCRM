/**
 * Semantic tone vocabulary shared by ViewModels (which decide *what* tone a
 * fact deserves) and the `TonePill` presentation primitive (which decides
 * how each tone *looks*). Lives in the data layer so ViewModels never have
 * to import from `components/`.
 */
export type PillTone = 'positive' | 'attention' | 'neutral'
