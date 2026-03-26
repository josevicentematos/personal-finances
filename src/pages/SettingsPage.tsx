import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { AppSettings } from '@/types'
import { PageSpinner } from '@/components/Spinner'
import { formatDateTime, normalizeNumberInput } from '@/lib/format'
import { useTranslation, Language } from '@/lib/i18n'

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [dollarRate, setDollarRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { t, language, setLanguage } = useTranslation()

  useEffect(() => {
    fetchSettings()
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings')}</h1>

      <div className="space-y-6 max-w-md">
        {/* Language Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('language')}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('languageLabel')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('spanish')}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('english')}
              </button>
            </div>
          </div>
        </div>

        {/* Dollar Rate Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dollarRateTitle')}</h2>

          {settings && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">
                $ {parseFloat(dollarRate).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t('lastUpdated')} {formatDateTime(settings.updated_at)}
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="dollarRate" className="block text-sm font-medium text-gray-700 mb-1">
                {t('newRate')}
              </label>
              <input
                id="dollarRate"
                type="text"
                inputMode="decimal"
                value={dollarRate}
                onChange={(e) => setDollarRate(normalizeNumberInput(e.target.value))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
