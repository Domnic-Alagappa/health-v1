/**
 * UI component prop types
 */

import type * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: React.ReactNode
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  help?: {
    content: string | React.ReactNode
    title?: string
  }
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  // Box is a simple wrapper, inherits all HTML div attributes
}

