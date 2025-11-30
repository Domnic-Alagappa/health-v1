/**
 * Utility functions for tab drag calculations
 */

const DASHBOARD_ID = "dashboard";

interface CalculateInsertionIndexOptions {
  e: MouseEvent;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  sortedTabsRef: React.MutableRefObject<
    Array<
      | { id: string; label: string; path: string; closable?: boolean; allowDuplicate?: boolean }
      | undefined
    >
  >;
}

export function calculateInsertionIndex({
  e,
  scrollContainerRef,
  sortedTabsRef,
}: CalculateInsertionIndexOptions): number {
  const container = scrollContainerRef.current;
  if (!container) return 0;

  const containerRect = container.getBoundingClientRect();

  // Get all tab elements in DOM order (including dashboard)
  const allTabElements = Array.from(container.querySelectorAll<HTMLElement>("[data-tab-id]"));

  if (allTabElements.length === 0) return 0;

  // Separate dashboard and non-dashboard tabs
  const dashboardElement = allTabElements.find(
    (el) => el.getAttribute("data-tab-id") === DASHBOARD_ID
  );
  const nonDashboardElements = allTabElements.filter(
    (el) => el.getAttribute("data-tab-id") !== DASHBOARD_ID
  );

  if (nonDashboardElements.length === 0) return 0;

  // Calculate mouse X position relative to container (accounting for scroll)
  const mouseX = e.clientX - containerRect.left + container.scrollLeft;

  // Calculate dashboard width if it exists
  const dashboardWidth = dashboardElement
    ? dashboardElement.getBoundingClientRect().width + 4 // +4 for gap
    : 0;

  // Adjust mouse X to account for dashboard (we only care about non-dashboard tabs)
  const adjustedMouseX = mouseX - dashboardWidth;

  // Calculate target insertion index based on mouse position
  let targetIndex = nonDashboardElements.length; // Default to end

  // Build a map of element -> actual tab index in sortedTabsRef
  // This ensures we use the correct index regardless of DOM order
  const elementToTabIndexMap = new Map<HTMLElement, number>();
  const nonDashboardTabs = sortedTabsRef.current.filter((t) => t && t.id !== DASHBOARD_ID);

  // Match each DOM element to its position in sorted tabs array
  nonDashboardElements.forEach((element) => {
    const tabId = element.getAttribute("data-tab-id");
    if (tabId) {
      const tabIndex = nonDashboardTabs.findIndex((t) => t && t.id === tabId);
      if (tabIndex >= 0) {
        elementToTabIndexMap.set(element, tabIndex);
      }
    }
  });

  // Find which tab the mouse is over or between
  for (let i = 0; i < nonDashboardElements.length; i++) {
    const element = nonDashboardElements[i];
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    const relativeLeft = rect.left - containerRect.left + container.scrollLeft - dashboardWidth;
    const relativeRight = rect.right - containerRect.left + container.scrollLeft - dashboardWidth;
    const tabWidth = rect.width;

    // Get the actual index of this tab in the sorted array
    const actualTabIndex = elementToTabIndexMap.get(element) ?? i;

    // Check if mouse is over this tab
    if (adjustedMouseX >= relativeLeft && adjustedMouseX <= relativeRight) {
      // Determine if mouse is on left or right half
      const tabCenter = relativeLeft + tabWidth / 2;

      if (adjustedMouseX < tabCenter) {
        // Insert before this tab
        targetIndex = actualTabIndex;
      } else {
        // Insert after this tab
        targetIndex = actualTabIndex + 1;
      }
      break;
    } else if (adjustedMouseX < relativeLeft && i === 0) {
      // Mouse is before first tab
      targetIndex = actualTabIndex;
      break;
    } else if (i < nonDashboardElements.length - 1) {
      // Check if mouse is between this tab and the next
      const nextElement = nonDashboardElements[i + 1];
      if (nextElement) {
        const nextRect = nextElement.getBoundingClientRect();
        const nextRelativeLeft =
          nextRect.left - containerRect.left + container.scrollLeft - dashboardWidth;

        if (adjustedMouseX > relativeRight && adjustedMouseX < nextRelativeLeft) {
          // Insert between current and next tab
          const nextActualIndex = elementToTabIndexMap.get(nextElement) ?? i + 1;
          // Use the next tab's index as the insertion point
          targetIndex = nextActualIndex;
          break;
        }
      }
    }
  }

  // Clamp to valid range
  return Math.max(0, Math.min(targetIndex, nonDashboardElements.length));
}
