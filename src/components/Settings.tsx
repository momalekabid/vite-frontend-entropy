import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

interface VCSettings {
  id?: number
  thesis_description?: string
  hard_requirements?: string
  educational_preferences?: string
  work_disqualifiers?: string
  unipile_api_key?: string
  unipile_linkedin_account_id?: string
  unipile_email_account_id?: string
  rocketreach_api_key?: string
  fullenrich_api_key?: string
  anthropic_api_key?: string
  google_api_key?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

interface SettingsProps {
  apiUrl: string
}

export default function Settings({ apiUrl }: SettingsProps) {
  const [settings, setSettings] = useState<VCSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/settings`)
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings(data.settings)
      } else {
        setSettings({})
      }
    } catch (error) {
      console.error('failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (data.success) {
        alert('settings saved successfully')
        fetchSettings()
      } else {
        alert('failed to save settings')
      }
    } catch (error) {
      console.error('failed to save settings:', error)
      alert('error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">fund settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            configure your investment thesis and preferences
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'saving...' : 'save settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* thesis description */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-2">thesis description</h2>
          <p className="text-xs text-muted-foreground mb-4">
            what are you looking for at a founder level?
          </p>
          <textarea
            value={settings.thesis_description || ''}
            onChange={(e) => setSettings({ ...settings, thesis_description: e.target.value })}
            placeholder="semiconductors defense ai infrastructure gpus robotics technical founders not the MBA crowd"
            className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* hard requirements */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-2">hard requirements</h2>
          <p className="text-xs text-muted-foreground mb-4">
            must-have criteria for founders
          </p>
          <textarea
            value={settings.hard_requirements || ''}
            onChange={(e) => setSettings({ ...settings, hard_requirements: e.target.value })}
            placeholder="currently building something, technical background, less than 2 years since founding"
            className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* educational preferences */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-2">educational preferences</h2>
          <p className="text-xs text-muted-foreground mb-4">
            preferred universities and schools
          </p>
          <textarea
            value={settings.educational_preferences || ''}
            onChange={(e) => setSettings({ ...settings, educational_preferences: e.target.value })}
            placeholder="MIT, Stanford, Caltech, top engineering programs, PhD in technical fields"
            className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* work disqualifiers */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-2">work disqualifiers</h2>
          <p className="text-xs text-muted-foreground mb-4">
            automatic disqualifying factors
          </p>
          <textarea
            value={settings.work_disqualifiers || ''}
            onChange={(e) => setSettings({ ...settings, work_disqualifiers: e.target.value })}
            placeholder="consultant background, too many advisor roles, no technical experience, moved to non-founding role"
            className="w-full h-24 px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* api keys section */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">api keys</h2>

          {/* unipile */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                unipile api key
              </label>
              <input
                type="password"
                value={settings.unipile_api_key || ''}
                onChange={(e) => setSettings({ ...settings, unipile_api_key: e.target.value })}
                placeholder="your unipile api key"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                unipile linkedin account id
              </label>
              <input
                type="text"
                value={settings.unipile_linkedin_account_id || ''}
                onChange={(e) => setSettings({ ...settings, unipile_linkedin_account_id: e.target.value })}
                placeholder="linkedin account id from unipile"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                unipile email account id
              </label>
              <input
                type="text"
                value={settings.unipile_email_account_id || ''}
                onChange={(e) => setSettings({ ...settings, unipile_email_account_id: e.target.value })}
                placeholder="email account id from unipile"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* enrichment services */}
          <div className="space-y-4 mb-6 pt-4 border-t border-border">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                fullenrich api key
              </label>
              <input
                type="password"
                value={settings.fullenrich_api_key || ''}
                onChange={(e) => setSettings({ ...settings, fullenrich_api_key: e.target.value })}
                placeholder="your fullenrich api key"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                rocketreach api key
              </label>
              <input
                type="password"
                value={settings.rocketreach_api_key || ''}
                onChange={(e) => setSettings({ ...settings, rocketreach_api_key: e.target.value })}
                placeholder="your rocketreach api key"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* ai services */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                anthropic api key
              </label>
              <input
                type="password"
                value={settings.anthropic_api_key || ''}
                onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                placeholder="your anthropic api key"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                google gemini api key
              </label>
              <input
                type="password"
                value={settings.google_api_key || ''}
                onChange={(e) => setSettings({ ...settings, google_api_key: e.target.value })}
                placeholder="your google gemini api key"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
