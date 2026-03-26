// 15 pastel colors for categories
export const CATEGORY_COLORS = [
  '#E8F4FD', // Light blue
  '#E8F5E9', // Light green
  '#FFF3E0', // Light orange
  '#FCE4EC', // Light pink
  '#F3E5F5', // Light purple
  '#E0F7FA', // Light cyan
  '#FFF8E1', // Light amber
  '#EFEBE9', // Light brown
  '#E8EAF6', // Light indigo
  '#F1F8E9', // Light lime
  '#FBE9E7', // Light deep orange
  '#E1F5FE', // Light light blue
  '#F9FBE7', // Light lime yellow
  '#EDE7F6', // Light deep purple
  '#E0F2F1', // Light teal
] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0]
