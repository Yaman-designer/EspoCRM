import { create } from 'zustand'

export const SIDEBAR_MIN = 64      // icon-only
export const SIDEBAR_MAX = 320
export const SIDEBAR_DEFAULT = 220
export const SIDEBAR_SNAP = 120    // below this → snap to icon-only

interface SidebarStore {
  width: number
  mobileOpen: boolean
  dragging: boolean
  setWidth: (w: number) => void
  snapAfterDrag: () => void
  toggle: () => void
  setMobileOpen: (v: boolean) => void
  setDragging: (v: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  width: SIDEBAR_DEFAULT,
  mobileOpen: false,
  dragging: false,

  setWidth: (w) =>
    set({ width: Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w)) }),

  snapAfterDrag: () => {
    const { width } = get()
    set({ dragging: false, width: width < SIDEBAR_SNAP ? SIDEBAR_MIN : width })
  },

  toggle: () => {
    const { width } = get()
    set({ width: width > SIDEBAR_MIN ? SIDEBAR_MIN : SIDEBAR_DEFAULT })
  },

  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  setDragging: (dragging) => set({ dragging }),
}))
