import { useState, useEffect } from 'react'
import { Calendar, Play, Pause, Trash2, Plus, RefreshCw, Clock, X } from 'lucide-react'
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

    // optimistically remove from view immediately
    setSearches(prev => prev.filter(s => s.id !== id))

    try {
      const res = await authenticatedFetch(`${apiBase}/api/scheduled-searches/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // already removed from view, just show success
        console.log('scheduled search deleted successfully')
      } else {
        const error = await res.text()
        console.warn(`backend delete failed: ${error}`)
        // don't add it back - still removed from view
      }
    } catch (err) {
      console.error('error deleting scheduled search:', err)
      // don't add it back - still removed from view
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
    <div style={{
      marginBottom: '2rem',
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    }}>
      {/* header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: showCreateForm || searches.length > 0 ? '1.5rem' : '0'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--foreground)'
          }}>
            <Calendar size={22} />
            scheduled searches
          </h3>
          <p style={{
            margin: '0.375rem 0 0 0',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)'
          }}>
            automatic recurring searches • runs every day/week/month
          </p>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.125rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }}
          >
            <Plus size={16} />
            new scheduled search
          </button>
        )}
      </div>

      {/* create form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>create scheduled search</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '0.25rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input
              type="text"
              placeholder="name (e.g., 'deeptech founders - sf')"
              value={newSearch.name}
              onChange={(e) => setNewSearch({ ...newSearch, name: e.target.value })}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />

            <input
              type="text"
              placeholder="search query (e.g., 'ai founders in san francisco')"
              value={newSearch.query}
              onChange={(e) => setNewSearch({ ...newSearch, query: e.target.value })}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />

            <input
              type="text"
              placeholder="description (optional)"
              value={newSearch.description}
              onChange={(e) => setNewSearch({ ...newSearch, description: e.target.value })}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />

            <select
              value={newSearch.frequency}
              onChange={(e) => setNewSearch({ ...newSearch, frequency: e.target.value })}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>

            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--foreground)'
                }}
              >
                cancel
              </button>
              <button
                onClick={createScheduledSearch}
                disabled={creating || !newSearch.name || !newSearch.query}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  cursor: creating || !newSearch.name || !newSearch.query ? 'not-allowed' : 'pointer',
                  opacity: creating || !newSearch.name || !newSearch.query ? 0.5 : 1,
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {creating ? 'creating...' : 'create search'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* searches list */}
      {searches.length === 0 && !showCreateForm ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--muted-foreground)'
        }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto' }} />
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', fontWeight: '500' }}>no scheduled searches yet</p>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>create one to automatically run searches on a schedule</p>
        </div>
      ) : searches.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {searches.map(search => (
            <div
              key={search.id}
              style={{
                backgroundColor: search.is_active ? 'var(--background)' : 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.625rem',
                padding: '1.125rem',
                opacity: search.is_active ? 1 : 0.7,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                {/* left side - info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '600' }}>{search.name}</h4>
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '0.1875rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: search.is_active ? 'var(--primary)' : 'var(--muted)',
                      color: search.is_active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      {search.is_active ? 'active' : 'paused'}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '0.1875rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--secondary-foreground)',
                      fontWeight: '500'
                    }}>
                      runs every {search.frequency === 'daily' ? '24h' : search.frequency === 'weekly' ? '7d' : '30d'}
                    </span>
                  </div>

                  <p style={{
                    margin: '0 0 0.625rem 0',
                    fontSize: '0.8125rem',
                    color: 'var(--foreground)',
                    lineHeight: '1.5'
                  }}>
                    "{search.query}"
                  </p>

                  {search.description && (
                    <p style={{
                      margin: '0 0 0.625rem 0',
                      fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                      fontStyle: 'italic'
                    }}>
                      {search.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '1.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--muted-foreground)',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={13} />
                      last: {formatDate(search.last_run_at)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <RefreshCw size={13} />
                      next: {formatDate(search.next_run_at)}
                    </span>
                    <span>{search.total_runs} runs</span>
                    <span>{search.total_candidates_found} candidates</span>
                  </div>
                </div>

                {/* right side - actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => runNow(search.id)}
                    disabled={runningId === search.id}
                    title="run now"
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: runningId === search.id ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (runningId !== search.id) {
                        e.currentTarget.style.backgroundColor = 'var(--accent)'
                      }
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card)'}
                  >
                    <RefreshCw size={15} style={{ animation: runningId === search.id ? 'spin 1s linear infinite' : 'none' }} />
                  </button>

                  <button
                    onClick={() => toggleSearch(search.id)}
                    title={search.is_active ? 'pause' : 'resume'}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card)'}
                  >
                    {search.is_active ? <Pause size={15} /> : <Play size={15} />}
                  </button>

                  <button
                    onClick={() => deleteSearch(search.id)}
                    title="delete"
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--destructive)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--destructive)'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card)'
                      e.currentTarget.style.color = 'var(--destructive)'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
