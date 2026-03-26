import { CATEGORY_COLORS } from '@/lib/colors'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            value === color
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  )
}
