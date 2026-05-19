// ── Stage select options (status2) — values = EspoCRM enum keys ───────────────

export const STAGE_OPTIONS = [
  { value: '1. Νέα Επαφή',             label: '1. Πρώτη Επικοινωνία' },
  { value: '2. Αξιολογημένος Πωλητής', label: '2. Αξιολόγηση Πωλητή' },
  { value: '3.',                        label: '3. Παρουσίαση Υπηρεσιών' },
  { value: '4.',                        label: '4. Ανάληψη με Απλή Εντολή' },
  { value: '5.',                        label: '5. Πρόταση Αποκλειστικής' },
  { value: '6.',                        label: '6. Αποκλειστική Onboarding' },
  { value: '7.',                        label: '7. Συγκριτική Ανάλυση Αγοράς' },
  { value: '8.',                        label: '8. Επαναπροσδιορισμός Τιμής' },
  { value: '9.',                        label: '9. Ραντεβού για Πανό' },
  { value: '10.',                       label: '10. Έναρξη Marketing' },
  { value: '11.',                       label: '11. Showings – Showings & Αλλαγές' },
  { value: '12.',                       label: '12. Strategy Review – Follow-Up' },
  { value: '13.',                       label: '13. Διαπραγμάτευση' },
  { value: '14.',                       label: '14. Ολοκλήρωση Συμφωνίας' },
]

// lookup: stored key → display label
export const STAGE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  STAGE_OPTIONS.map((o) => [o.value, o.label]),
)

// ── Contact type options — values = EspoCRM enum keys ─────────────────────────

export const CONTACT_TYPE_OPTIONS = [
  { value: 'ραντεβού',                 label: 'ραντεβού / meeting' },
  { value: 'κλήση',                    label: 'κλήση / follow up' },
  { value: 'ηλεκτρονική επικοινωνία', label: 'ηλεκτρονική επικοινωνία' },
]

// ── Status → badge variant ────────────────────────────────────────────────────

export const STATUS_BADGE_MAP: Record<string, string> = {
  'Planned':            'info',
  'Held':               'won',
  'Not Held':           'cancelled',
  'Held (need update)': 'warning',
}

// ── Contact type → badge variant ─────────────────────────────────────────────

export const CONTACT_TYPE_BADGE_MAP: Record<string, string> = {
  'ραντεβού':                'visit',
  'κλήση':                   'on-process',
  'ηλεκτρονική επικοινωνία': 'info',
}
