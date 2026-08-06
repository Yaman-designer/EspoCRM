// ── Compact-aware label resolution ───────────────────────────────────────────
// Single mechanism behind every domain label resolver (status, property type,
// and any future one). A raw EspoCRM value maps to an i18n key; that key is
// read from a "full" namespace by default, or from a parallel "compact"
// namespace when the caller opts in. Presentation components only ever see
// the resulting string — never the namespace names, never whether a compact
// override exists for a given key. Adding a new compact-aware label means
// wiring one more `createLabelResolver` call, not inventing a new resolution
// path.

export type Translator = (key: string) => string

export interface LabelOptions {
  /** Prefer the short/compact form for width-constrained UI (card chips,
   *  overlay badges). Falls back to the full label wherever no compact
   *  override exists for the resolved key. */
  compact?: boolean
}

interface LabelResolverConfig {
  /** i18n namespace holding the full-length labels, e.g. 'statuses'. */
  namespace: string
  /** i18n namespace holding compact overrides, e.g. 'statusesCompact' or 'types.compact'. */
  compactNamespace: string
  /** Raw value → i18n key, shared by both namespaces above. */
  keyMap: Record<string, string>
  /** Keys that actually have a distinct compact override. Omit to mean
   *  "every mapped key has one" (a fully parallel compact namespace). */
  compactOverrideKeys?: ReadonlySet<string>
  /** Label for a raw value with no `keyMap` entry (unknown/future value). */
  fallback: (value: string) => string
}

/** Builds a `(value, t, options?) => string` resolver for one domain entity. */
export function createLabelResolver(config: LabelResolverConfig) {
  return function resolveLabel(value: string, t: Translator, options: LabelOptions = {}): string {
    const key = config.keyMap[value]
    if (!key) return config.fallback(value)

    const wantsCompact = !!options.compact
    const hasCompactOverride = !config.compactOverrideKeys || config.compactOverrideKeys.has(key)
    const namespace = wantsCompact && hasCompactOverride ? config.compactNamespace : config.namespace

    return t(`${namespace}.${key}`)
  }
}
