export interface ColorPair {
  light: string
  dark: string
}

export const COLOR_PAIRS: ColorPair[] = [
  { light: '#E8F4FD', dark: '#1A365D' }, // Blue
  { light: '#E8F5E9', dark: '#1A3D2B' }, // Green
  { light: '#FFF3E0', dark: '#3D2200' }, // Orange
  { light: '#FCE4EC', dark: '#3D0B1F' }, // Pink
  { light: '#F3E5F5', dark: '#2D1040' }, // Purple
  { light: '#E0F7FA', dark: '#003D45' }, // Cyan
  { light: '#FFF8E1', dark: '#3D2E00' }, // Amber
  { light: '#EFEBE9', dark: '#2D1A0B' }, // Brown
  { light: '#E8EAF6', dark: '#1A1F5E' }, // Indigo
  { light: '#F1F8E9', dark: '#1A2D05' }, // Lime
  { light: '#FBE9E7', dark: '#3D1000' }, // Deep orange
  { light: '#E1F5FE', dark: '#0A2840' }, // Light blue
  { light: '#F9FBE7', dark: '#1F2D05' }, // Lime yellow
  { light: '#EDE7F6', dark: '#1F0D3D' }, // Deep purple
  { light: '#E0F2F1', dark: '#003D3A' }, // Teal
]

// Keep flat list for backward compatibility
export const CATEGORY_COLORS = COLOR_PAIRS.map((p) => p.light) as readonly string[]

export type CategoryColor = string

export const DEFAULT_COLOR_PAIR = COLOR_PAIRS[0]!
export const DEFAULT_CATEGORY_COLOR = DEFAULT_COLOR_PAIR.light

export function getDarkColor(lightColor: string): string {
  return COLOR_PAIRS.find((p) => p.light === lightColor)?.dark ?? lightColor
}
