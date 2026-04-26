import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'

export const CALENDAR_URL_KEY = 'bitacora-calendar-url'

function forceWeekView(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('mode', 'WEEK')
    parsed.searchParams.set('showTitle', '0')
    return parsed.toString()
  } catch {
    return url
  }
}

export function CalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(CALENDAR_URL_KEY)
    setEmbedUrl(stored)
  }, [])

  if (!embedUrl) {
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
          src={forceWeekView(embedUrl)}
          className="w-full h-full"
          frameBorder="0"
          scrolling="no"
          title={t('calendarTitle')}
        />
      </div>
    </div>
  )
}
