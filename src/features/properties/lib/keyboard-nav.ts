// Interaction Design Sprint 4 (2026-07-18). Shared roving-tabindex arrow-key
// handler for the page's two segmented button groups (Asset Management's
// Photos/Floor Plans/Drone/Legal tabs, Location Intelligence's Education/
// Medical/Transit/Walk filter) — both were plain onClick button rows with no
// keyboard path besides Tab-ing through every button individually. One
// implementation instead of two copies of the same arrow-key math.

export function handleRovingTabListKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  ids: string[],
  activeId: string,
  onActivate: (id: string) => void,
) {
  const currentIndex = ids.indexOf(activeId)
  if (currentIndex === -1) return

  let nextIndex: number | null = null
  if (e.key === 'ArrowRight')      nextIndex = (currentIndex + 1) % ids.length
  else if (e.key === 'ArrowLeft')  nextIndex = (currentIndex - 1 + ids.length) % ids.length
  else if (e.key === 'Home')       nextIndex = 0
  else if (e.key === 'End')        nextIndex = ids.length - 1
  if (nextIndex == null) return

  e.preventDefault()
  const nextId = ids[nextIndex]
  onActivate(nextId)
  e.currentTarget.querySelector<HTMLElement>(`[data-tab-id="${nextId}"]`)?.focus()
}
