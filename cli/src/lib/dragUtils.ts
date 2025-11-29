/**
 * Efficient tab reordering algorithm using optimized array manipulation
 * O(n) time complexity for reordering operations with minimal memory allocation
 */

export interface TabOrder {
  id: string
  order: number
}

/**
 * Reorder tabs using efficient array manipulation with minimal allocations
 * O(n) time complexity, O(n) space for result array
 * Simple and correct algorithm: remove from source, insert at target
 */
export function reorderTabsArray<T extends { id: string }>(
  tabs: T[],
  draggedId: string,
  targetIndex: number,
  _dashboardId: string = "dashboard"
): T[] {
  // Early return if empty
  if (tabs.length === 0) return tabs

  // Find dragged tab index - O(n) single pass
  let draggedIndex = -1
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === draggedId) {
      draggedIndex = i
      break
    }
  }

  if (draggedIndex === -1) return tabs // Tab not found

  // If already at target position, no change needed
  if (draggedIndex === targetIndex) return tabs

  // Efficient reordering: remove from source, insert at target
  const result = [...tabs] // Create copy
  const [draggedTab] = result.splice(draggedIndex, 1) // Remove from source position

  // Adjust target index if dragging forward (after removal)
  const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex

  // Insert at target position
  result.splice(adjustedTargetIndex, 0, draggedTab)

  return result
}

/**
 * Binary search to find insertion point for drag position
 * O(log n) time complexity - optimal for sorted position arrays
 */
export function findInsertionIndex(positions: number[], dragPosition: number): number {
  if (positions.length === 0) return 0

  let left = 0
  let right = positions.length - 1
  let result = positions.length

  // Binary search for optimal insertion point
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (positions[mid] > dragPosition) {
      result = mid
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  return result
}

/**
 * Calculate tab positions from DOM elements with caching optimization
 * Returns array of center positions for each tab
 * Uses getBoundingClientRect() efficiently with minimal DOM queries
 */
export function getTabPositions(container: HTMLElement, tabElements: HTMLElement[]): number[] {
  if (tabElements.length === 0) return []

  const containerRect = container.getBoundingClientRect()
  const scrollLeft = container.scrollLeft

  // Pre-allocate array for better performance
  const positions = new Array(tabElements.length)

  // Single pass calculation
  for (let i = 0; i < tabElements.length; i++) {
    const rect = tabElements[i].getBoundingClientRect()
    const left = rect.left - containerRect.left + scrollLeft
    const width = rect.width
    positions[i] = left + width / 2 // Return center position
  }

  return positions
}

/**
 * Efficient tab lookup using Map for O(1) access
 * Useful for frequent tab lookups
 */
export class TabIndex {
  private idMap = new Map<string, number>()
  private pathMap = new Map<string, number>()

  constructor(tabs: Array<{ id: string; path: string }>) {
    this.rebuild(tabs)
  }

  rebuild(tabs: Array<{ id: string; path: string }>) {
    this.idMap.clear()
    this.pathMap.clear()

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      this.idMap.set(tab.id, i)
      this.pathMap.set(tab.path, i)
    }
  }

  getIndexById(id: string): number | undefined {
    return this.idMap.get(id)
  }

  getIndexByPath(path: string): number | undefined {
    return this.pathMap.get(path)
  }
}
