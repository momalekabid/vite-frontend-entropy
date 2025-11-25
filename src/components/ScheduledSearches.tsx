import { useState, useEffect } from 'react'
import { Calendar, Play, Pause, Trash2, Plus, RefreshCw, Clock } from 'lucide-react'
import { authenticatedFetch } from '../utils/api'

interface ScheduledSearch {
  id: number
  name: string
  query: string
  description?: string
  frequency: string
  is_active: boolean
  last_run_at?: string
  next_run_at?: string
  total_candidates_found: number
  total_runs: number
}

interface ScheduledSearchesProps {
  apiBase: string
}

export default function ScheduledSearches({ apiBase }: ScheduledSearchesProps) {
  const [searches, setSearches] = useState<ScheduledSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSearch, setNewSearch] = useState({
    name: '',
    query: '',
    description: '',
    frequency: 'weekly'
  })
  const [creating, setCreating] = useState(false)
  const [runningId, setRunningId] = useState<number | null>(null)

  const fetchScheduledSearches = async () => {
    try {
      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches`)
      if (res.ok) {
        const data = await res.json()
        setSearches(data.scheduled_searches || [])
      }
    } catch (err) {
      console.error('error fetching scheduled searches:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledSearches()
  }, [])

  const createScheduledSearch = async () => {
    if (!newSearch.name || !newSearch.query) return

    setCreating(true)
    try {
      const params = new URLSearchParams({
        name: newSearch.name,
        query: newSearch.query,
        frequency: newSearch.frequency
      })
      if (newSearch.description) {
        params.append('description', newSearch.description)
      }

      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches?${params}`, {
        method: 'POST'
      })

      if (res.ok) {
        setNewSearch({ name: '', query: '', description: '', frequency: 'weekly' })
        setShowCreateForm(false)
        fetchScheduledSearches()
      }
    } catch (err) {
      console.error('error creating scheduled search:', err)
    } finally {
      setCreating(false)
    }
  }

  const toggleSearch = async (id: number) => {
    try {
      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches/${id}/toggle`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchScheduledSearches()
      }
    } catch (err) {
      console.error('error toggling scheduled search:', err)
    }
  }

  const deleteSearch = async (id: number) => {
    if (!confirm('delete this scheduled search?')) return

    try {
      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchScheduledSearches()
      }
    } catch (err) {
      console.error('error deleting scheduled search:', err)
    }
  }

  const runNow = async (id: number) => {
    setRunningId(id)
    try {
      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches/${id}/run-now`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        alert(`search started! job id: ${data.job_id}`)
        fetchScheduledSearches()
      }
    } catch (err) {
      console.error('error running scheduled search:', err)
    } finally {
      setRunningId(null)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'never'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="loading">loading scheduled searches...</div>
  }

  return (
    <div className="scheduled-searches-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} />
            scheduled searches ({searches.length})
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            recurring searches that run automatically on schedule
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="icon-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          add scheduled search
        </button>
      </div>

      {/* create form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>create scheduled search</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="name (e.g., 'deeptech founders - sf')"
              value={newSearch.name}
              onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })}
              style={{
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)'
              }}
            />
            <input
              type="text"
              placeholder="search query (e.g., 'ai founders in san francisco')"
              value={newSearch.query}
              onChange={(e) => setNewSearch({ ...newSearch, query: e.target.value })}
              style={{
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)'
              }}
            />
            <input
              type="text"
              placeholder="description (optional)"
              value={newSearch.description}
              onChange={(e) => setNewSearch({ ...newSearch, description: e.target.value })}
              style={{
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)'
              }}
            />
            <select
              value={newSearch.frequency}
              onChange={(e) => setNewSearch({ ...newSearch, frequency: e.target.value })}
              style={{
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)'
              }}
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                cancel
              </button>
              <button
                onClick={createScheduledSearch}
                disabled={creating || !newSearch.name || !newSearch.query}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  cursor: creating ? 'wait' : 'pointer',
                  opacity: creating || !newSearch.name || !newSearch.query ? 0.5 : 1
                }}
              >
                {creating ? 'creating...' : 'create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* searches list */}
      {searches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--muted-foreground)',
          backgroundColor: 'var(--card)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <Calendar size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>no scheduled searches yet</p>
          <p style={{ fontSize: '0.875rem' }}>create one to automatically run searches on a schedule</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {searches.map(search => (
            <div
              key={search.id}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '1rem',
                opacity: search.is_active ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{search.name}</h4>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '1rem',
                      backgroundColor: search.is_active ? 'var(--primary)' : 'var(--muted)',
                      color: search.is_active ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                    }}>
                      {search.is_active ? 'active' : 'paused'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '1rem',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--secondary-foreground)'
                    }}>
                      {search.frequency}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {search.query}
                  </p>
                  {search.description && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {search.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      last run: {formatDate(search.last_run_at)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <RefreshCw size={12} />
                      next: {formatDate(search.next_run_at)}
                    </span>
                    <span>{search.total_runs} runs • {search.total_candidates_found} candidates found</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => runNow(search.id)}
                    disabled={runningId === search.id}
                    title="run now"
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      cursor: runningId === search.id ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Play size={16} style={{ animation: runningId === search.id ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                  <button
                    onClick={() => toggleSearch(search.id)}
                    title={search.is_active ? 'pause' : 'resume'}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {search.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => deleteSearch(search.id)}
                    title="delete"
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--destructive)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
