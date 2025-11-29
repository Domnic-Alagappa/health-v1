import type { CanvasGroup, CanvasSection } from "@/components/forms/canvas/types"

export function createCanvasGroup(index: number): CanvasGroup {
  return {
    id: `group-${Date.now()}`,
    title: `Group ${index + 1}`,
    x: 50 + (index % 3) * 300,
    y: 50 + Math.floor(index / 3) * 200,
    width: 400,
    height: 300,
    fields: [],
    collapsible: true,
    collapsed: false,
  }
}

export function createCanvasSection(index: number, canvasWidth?: number): CanvasSection {
  return {
    id: `section-${Date.now()}`,
    title: `Section ${index + 1}`,
    x: 50,
    y: 50 + index * 150,
    width: canvasWidth ? canvasWidth - 100 : 1100,
    height: 80,
  }
}
