import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enNav from './locales/en/nav.json'
import enDashboard from './locales/en/dashboard.json'
import enAuth from './locales/en/auth.json'
import enProfile from './locales/en/profile.json'
import enNotifications from './locales/en/notifications.json'
import enProperties from './locales/en/properties.json'

import elCommon from './locales/el/common.json'
import elNav from './locales/el/nav.json'
import elDashboard from './locales/el/dashboard.json'
import elAuth from './locales/el/auth.json'
import elProfile from './locales/el/profile.json'
import elNotifications from './locales/el/notifications.json'
import elProperties from './locales/el/properties.json'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'nav', 'dashboard', 'auth', 'profile', 'notifications', 'properties'],
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
      properties: enProperties,
    },
    el: {
      common: elCommon,
      nav: elNav,
      dashboard: elDashboard,
      auth: elAuth,
      profile: elProfile,
      notifications: elNotifications,
      properties: elProperties,
    },
  },
})

export default i18n
