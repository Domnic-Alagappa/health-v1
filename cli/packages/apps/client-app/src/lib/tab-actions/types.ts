import type { ReactNode } from "react";

export interface TabAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
}

export interface TabActionGroup {
  label?: string;
  actions: TabAction[];
}
