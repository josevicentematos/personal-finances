import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'

export const CALENDAR_URL_KEY = 'bitacora-calendar-urls'

export function loadCalendarUrls(): string[] {
  const stored = localStorage.getItem(CALENDAR_URL_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
    // Migrate from old single-string format
    return [stored]
  } catch {
    return [stored]
  }
}

export function saveCalendarUrls(urls: string[]) {
  localStorage.setItem(CALENDAR_URL_KEY, JSON.stringify(urls.filter(u => u.trim())))
}

function buildCombinedUrl(urls: string[]): string | null {
  const base = new URL('https://calendar.google.com/calendar/embed')
  base.searchParams.set('mode', 'WEEK')
  base.searchParams.set('showTitle', '0')
  base.searchParams.set('showNav', '1')
  base.searchParams.set('showDate', '1')
  base.searchParams.set('showPrint', '0')

  let srcCount = 0
  for (const url of urls) {
    try {
      const parsed = new URL(url.trim())
      const srcs = parsed.searchParams.getAll('src')
      for (const src of srcs) {
        base.searchParams.append('src', src)
        srcCount++
      }
    } catch {
      // skip malformed URLs
    }
  }

  return srcCount > 0 ? base.toString() : null
}

export function CalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  useEffect(() => {
    const urls = loadCalendarUrls()
    setIframeSrc(buildCombinedUrl(urls))
  }, [])

  if (!iframeSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <span className="text-5xl mb-4">📅</span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('calendarNotConfigured')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {t('calendarSetupPrompt')}
        </p>
        <ol className="text-sm text-gray-600 dark:text-gray-300 text-left space-y-2 list-decimal list-inside mb-8 max-w-sm">
          <li>{t('calendarStep1')}</li>
          <li>{t('calendarStep2')}</li>
          <li>{t('calendarStep3')}</li>
          <li>{t('calendarStep4')}</li>
        </ol>
        <button
          onClick={() => navigate('/settings')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('goToSettings')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col -mx-4 -mt-2 md:-mx-8 md:-mt-6">
      <div className="bg-white" style={{ height: 'calc(100vh - 4rem)' }}>
        <iframe
          src={iframeSrc}
          className="w-full h-full"
          frameBorder="0"
          scrolling="no"
          title={t('calendarTitle')}
        />
      </div>
    </div>
  )
}
