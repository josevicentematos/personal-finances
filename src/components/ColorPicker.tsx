import { COLOR_PAIRS } from '@/lib/colors'

interface ColorPickerProps {
  value: string
  valueDark: string
  onChange: (light: string, dark: string) => void
}

export function ColorPicker({ value, valueDark, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PAIRS.map((pair) => {
        const selected = value === pair.light && valueDark === pair.dark
        return (
          <button
            key={pair.light}
            type="button"
            onClick={() => onChange(pair.light, pair.dark)}
            className={`w-8 h-8 rounded-full border-2 transition-all overflow-hidden ${
              selected
                ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
            style={{
              background: `linear-gradient(135deg, ${pair.light} 50%, ${pair.dark} 50%)`,
            }}
            aria-label={`Select color ${pair.light} / ${pair.dark}`}
            title={`Light: ${pair.light} · Dark: ${pair.dark}`}
          />
        )
      })}
    </div>
  )
}
