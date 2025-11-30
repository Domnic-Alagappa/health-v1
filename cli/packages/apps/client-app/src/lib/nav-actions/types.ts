import type { ReactNode } from "react"

export interface NavAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
}
