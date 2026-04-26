import { useState, useEffect, FormEvent, useRef } from 'react'
import { CALENDAR_URL_KEY } from './CalendarPage'
import { supabase } from '@/lib/supabase'
import { AppSettings } from '@/types'
import { PageSpinner } from '@/components/Spinner'
import { formatDateTime, normalizeNumberInput } from '@/lib/format'
import { useTranslation, Language } from '@/lib/i18n'
import { useTheme, ThemeMode } from '@/lib/theme'

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [dollarRate, setDollarRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [calendarUrl, setCalendarUrl] = useState('')
  const [calendarSaved, setCalendarSaved] = useState(false)
  const { t, language, setLanguage } = useTranslation()
  const calendarInputRef = useRef<HTMLInputElement>(null)
  const { mode, setMode } = useTheme()

  useEffect(() => {
    fetchSettings()
    const stored = localStorage.getItem(CALENDAR_URL_KEY)
    if (stored) setCalendarUrl(stored)
  }, [])

  async function fetchSettings() {
    const { data, error } = await supabase.from('app_settings').select('*').single()

    if (error) {
      console.error('Error fetching settings:', error)
    } else {
      setSettings(data)
      setDollarRate(data.dollar_rate.toString())
    }
    setLoading(false)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('app_settings')
      .update({
        dollar_rate: parseFloat(dollarRate),
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)

    if (error) {
      console.error('Error saving settings:', error)
    } else {
      setSaved(true)
      fetchSettings()
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  function handleLanguageChange(lang: Language) {
    setLanguage(lang)
  }

  if (loading) return <PageSpinner />

  function handleThemeChange(newMode: ThemeMode) {
    setMode(newMode)
  }

  function handleCalendarSave() {
    localStorage.setItem(CALENDAR_URL_KEY, calendarUrl.trim())
    setCalendarSaved(true)
    setTimeout(() => setCalendarSaved(false), 2000)
  }

  function handleCalendarClear() {
    localStorage.removeItem(CALENDAR_URL_KEY)
    setCalendarUrl('')
    calendarInputRef.current?.focus()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('settings')}</h1>

      <div className="space-y-6 max-w-md">
        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('language')}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('languageLabel')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('spanish')}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('english')}
              </button>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('theme')}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('themeLabel')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('themeLight')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('themeDark')}
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'system'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('themeSystem')}
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('calendarTitle')}</h2>
          <div className="space-y-3">
            <label htmlFor="calendarUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('calendarEmbedUrl')}
            </label>
            <input
              id="calendarUrl"
              ref={calendarInputRef}
              type="url"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder={t('calendarEmbedUrlPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCalendarSave}
                disabled={!calendarUrl.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {calendarSaved ? t('calendarUrlSaved') : t('calendarSave')}
              </button>
              <button
                onClick={handleCalendarClear}
                disabled={!calendarUrl}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {t('calendarClear')}
              </button>
            </div>
          </div>
        </div>

        {/* Dollar Rate Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dollarRateTitle')}</h2>

          {settings && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                $ {parseFloat(dollarRate).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('lastUpdated')} {formatDateTime(settings.updated_at)}
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="dollarRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newRate')}
              </label>
              <input
                id="dollarRate"
                type="text"
                inputMode="decimal"
                value={dollarRate}
                onChange={(e) => setDollarRate(normalizeNumberInput(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('saving') : saved ? t('saved') : t('saveRate')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
