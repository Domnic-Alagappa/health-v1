/**
 * Component registry types
 */

import type * as React from "react";

export interface ActionItem {
  readonly id: string;
  readonly label: string;
  readonly action: () => void | Promise<void>;
  readonly i18nKey?: string;
  readonly voiceCommand?: string | string[]; // Voice command patterns that trigger this action
  readonly confirmationRequired?: boolean;
}

export interface ComponentStructure {
  readonly type:
    | "form"
    | "button"
    | "dropdown"
    | "table"
    | "modal"
    | "card"
    | "input"
    | "navigation"
    | "other";
  readonly fields?: FieldStructure[];
  readonly options?: OptionStructure[];
  readonly columns?: ColumnStructure[];
  readonly rows?: RowStructure[];
  readonly actions?: ActionStructure[];
  readonly sections?: SectionStructure[];
  readonly dataPoints?: DataPointStructure[];
  readonly validation?: ValidationRules;
  readonly currentValue?: string | number | boolean;
  readonly content?: string;
  readonly label?: string;
  readonly placeholder?: string;
}

export interface FieldStructure {
  readonly id: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly type: string;
  readonly required?: boolean;
  readonly validation?: ValidationRules;
  readonly ref?: { current: HTMLElement | null };
}

export interface OptionStructure {
  readonly value: string | number;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface ColumnStructure {
  readonly id: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
}

export interface RowStructure {
  readonly id: string;
  readonly data: Record<string, unknown>;
}

export interface ActionStructure {
  readonly id: string;
  readonly label: string;
  readonly type: "button" | "link" | "menu-item";
  readonly ref?: { current: HTMLElement | null };
  readonly confirmationRequired?: boolean;
}

export interface SectionStructure {
  readonly id: string;
  readonly label: string;
  readonly content?: string;
}

export interface DataPointStructure {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
}

export interface ValidationRules {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly min?: number;
  readonly max?: number;
  readonly errorMessage?: string;
}

export interface ComponentConfig {
  readonly showHelp?: boolean;
  readonly helpContent?: string | React.ReactNode;
  readonly helpTitle?: string;
  readonly helpVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  readonly helpSize?: "default" | "sm" | "lg" | "icon";
  readonly className?: string;
  readonly customizations?: Readonly<Record<string, unknown>>;
  // Accessibility metadata
  readonly ariaLabel?: string;
  readonly ariaLabelledBy?: string;
  readonly ariaDescribedBy?: string;
  readonly role?: string;
  readonly i18nKey?: string;
  // Voice command support
  readonly voiceInteractable?: boolean; // Whether component supports voice interaction (default: true)
  readonly voiceDescription?: string; // How to describe this component for voice commands
  readonly actionItems?: ActionItem[]; // Available actions for voice commands
  readonly componentStructure?: ComponentStructure; // Expose component structure to LLM
}

export interface ComponentWithHelpProps {
  help?: {
    content: string | React.ReactNode;
    title?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  };
  className?: string;
  children?: React.ReactNode;
}

export type HelpHintPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "inline";

export interface HelpHintProps {
  readonly content: string | React.ReactNode;
  readonly title?: string;
  readonly variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  readonly size?: "default" | "sm" | "lg" | "icon";
  readonly position?: HelpHintPosition;
  readonly className?: string;
  readonly id?: string;
  readonly "aria-label"?: string;
}
