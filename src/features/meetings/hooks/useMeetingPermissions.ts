'use client'

import { useAuth } from '@/providers/AuthProvider'
import { isAclActionDenied } from '@/types/espo-acl'

// Same pattern as usePropertyDeletePermission — a UX nicety (hide/disable
// affordances the user can't use), not a security boundary; EspoCRM still
// enforces the real 403 server-side regardless of what this returns.
export function useMeetingPermissions(): { canCreate: boolean; canEdit: boolean; canDelete: boolean } {
  const { session } = useAuth()
  return {
    canCreate: !isAclActionDenied(session?.acl, 'Meeting', 'create'),
    canEdit: !isAclActionDenied(session?.acl, 'Meeting', 'edit'),
    canDelete: !isAclActionDenied(session?.acl, 'Meeting', 'delete'),
  }
}
