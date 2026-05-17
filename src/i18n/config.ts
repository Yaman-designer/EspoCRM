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

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'nav', 'dashboard', 'auth', 'profile', 'notifications'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
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
