import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Enterprise Certification Program, EC-9 (2026-07-16). Unit-test layer for
// pure, isolated logic — domain rules, payload/transform builders, the
// form-engine's Visibility/Dependency engines, the error classifier,
// formatting, repositories (mocked at the axios layer). Complements, does
// not replace, the existing Playwright suite (./e2e) — that suite drives a
// real browser against real EspoCRM staging and is the only place this
// app's actual rendered UI and live API contracts are verified; nothing
// here mocks or re-implements what that suite already covers.
//
// environment: 'node', not the Next.js docs' default 'jsdom' — every test
// this pass exercises plain TypeScript logic, not rendered React components,
// and 'node' is materially faster with nothing to lose for this corpus. A
// future test that needs to render a component can opt into jsdom per-file
// via a `// @vitest-environment jsdom` docblock (Vitest's own supported
// mechanism) — see the EC-9 Certification Report for why
// @testing-library/react/@vitejs/plugin-react were not installed this pass
// (a real, pre-existing babel 7 vs 8-rc peer conflict in this repo's current
// toolchain, unrelated to this change).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/errors/**',
        'src/lib/format.ts',
        'src/features/properties/domain/**',
        'src/features/properties/lib/property-form.transform.ts',
        'src/features/properties/lib/property-financial.ts',
        'src/features/properties/lib/attachment-upload.service.ts',
        'src/features/properties/lib/property-health.ts',
        'src/features/properties/lib/property-intelligence.ts',
        'src/features/properties/lib/property-narrative.ts',
        'src/features/properties/lib/property-feature-mapper.ts',
        'src/features/properties/lib/data-completeness.ts',
        'src/features/properties/lib/portfolio-analytics.ts',
        'src/features/properties/lib/mappers/status-presentation.ts',
        // Enterprise 100% Data Certification (2026-07-23). Property
        // Details' entire container-builds-ViewModel layer — the critical
        // business logic a field-coverage certification is actually
        // about (field selection, conditional visibility, null/edge-case
        // fallbacks, media selection). Added here specifically so
        // `test:coverage` reports real, provable numbers for this layer
        // instead of the certification report asserting coverage that
        // was never actually measured.
        'src/features/properties/view-models/**',
        'src/features/properties/repositories/**',
        'src/framework/form-engine/VisibilityEngine.ts',
        'src/framework/form-engine/DependencyEngine.ts',
        'src/app/api/search/route.ts',
      ],
      reporter: ['text', 'html'],
    },
  },
})
