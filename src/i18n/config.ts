import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enNav from './locales/en/nav.json'
import enDashboard from './locales/en/dashboard.json'
import enAuth from './locales/en/auth.json'
import enProfile from './locales/en/profile.json'
import enNotifications from './locales/en/notifications.json'

import elCommon from './locales/el/common.json'
import elNav from './locales/el/nav.json'
import elDashboard from './locales/el/dashboard.json'
import elAuth from './locales/el/auth.json'
import elProfile from './locales/el/profile.json'
import elNotifications from './locales/el/notifications.json'

// No 'properties' namespace — Architecture Debt Rank #9/9a found the
// Properties feature has zero useTranslation() usage anywhere (a Product
// Decision, not an engineering gap: real translations for ~125 live fields
// need business sign-off), and the one existing properties.json (en/el)
// carried stale, actively-wrong content (fabricated statuses, USD pricing)
// that would have silently reintroduced two already-fixed defects if ever
// wired up. Removed rather than left dormant. See the Phase 2 Certification
// Report for the full evidence trail.

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'nav', 'dashboard', 'auth', 'profile', 'notifications'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  // Opts out of react-i18next v17's use()-based Suspense integration.
  // With useSuspense: true (the v17 default), useTranslation() calls React.use(Promise)
  // if the i18n instance isn't synchronously ready. Under cacheComponents: true (which
  // activates dynamicIO + PPR), that use() call is flagged as "uncached data" during
  // the PPR static-shell prerender of dynamic routes — causing the build to fail with
  // "Uncached data was accessed outside of <Suspense>". Setting this to false makes
  // the hook return keys/empty strings synchronously instead of suspending.
  react: { useSuspense: false },
  resources: {
    en: {
      common: enCommon,
      nav: enNav,
      dashboard: enDashboard,
      auth: enAuth,
      profile: enProfile,
      notifications: enNotifications,
    },
    el: {
      common: elCommon,
      nav: elNav,
      dashboard: elDashboard,
      auth: elAuth,
      profile: elProfile,
      notifications: elNotifications,
    },
  },
})

export default i18n
