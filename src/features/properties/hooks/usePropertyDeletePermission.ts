'use client'

import { useAuth } from '@/providers/AuthProvider'
import { isAclActionDenied } from '@/types/espo-acl'

// Single source of truth for "can the current user delete a property,"
// per EspoCRM's own ACL (threaded through the session at login — see
// src/lib/auth.ts). A UX nicety, not a security boundary: EspoCRM still
// enforces the real check server-side regardless of what this returns.
// Used by every property delete entry point (PropertyListRenderer.tsx,
// PropertyDetailPage.tsx) so the check exists in exactly one place.
export function usePropertyDeletePermission(): { denied: boolean } {
  const { session } = useAuth()
  return { denied: isAclActionDenied(session?.acl, 'RealEstateProperty', 'delete') }
}
