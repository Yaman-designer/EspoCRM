'use client'

import { Menu, X, PanelLeft, PanelLeftClose } from 'lucide-react'
import { btnCls } from './styles'

interface Props {
  mobileOpen: boolean
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarToggle({ mobileOpen, isCollapsed, onToggle }: Props) {
  return (
    <button onClick={onToggle} className={btnCls} aria-label="Toggle sidebar">
      {mobileOpen
        ? <X    className="h-4 w-4 md:hidden" />
        : <Menu className="h-4 w-4 md:hidden" />}
      {isCollapsed
        ? <PanelLeft      className="h-4 w-4 hidden md:block" />
        : <PanelLeftClose className="h-4 w-4 hidden md:block" />}
    </button>
  )
}
