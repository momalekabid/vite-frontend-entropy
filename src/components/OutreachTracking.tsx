import { useState, useEffect } from 'react'
import { API_BASE } from '../config'

interface Outreach {
  id: number
  candidate_name: string
  linkedin_url: string
  email: string
  channel: string
  status: string
  sent_at: string | null
  replied_at: string | null
  reached_out: boolean
  replied: boolean
}

export default function OutreachTracking() {
  const [outreaches, setOutreaches] = useState<Outreach[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all')

  useEffect(() => {
    fetchOutreaches()
  }, [])

  const fetchOutreaches = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/outreach`)
      const data = await response.json()
      if (data.success) {
        setOutreaches(data.outreaches)
      }
    } catch (err) {
      console.error('error fetching outreaches:', err)
    } finally {
      setLoading(false)
    }
  }

  const markReplied = async (outreachId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/outreach/${outreachId}/mark-replied`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchOutreaches()
      }
    } catch (err) {
      console.error('error marking replied:', err)
    }
  }

  const filteredOutreaches = outreaches.filter(o => {
    if (filter === 'pending') return o.reached_out && !o.replied
    if (filter === 'replied') return o.replied
    return true
  })

  const stats = {
    total: outreaches.length,
    pending: outreaches.filter(o => o.reached_out && !o.replied).length,
    replied: outreaches.filter(o => o.replied).length,
    replyRate: outreaches.length > 0
      ? Math.round((outreaches.filter(o => o.replied).length / outreaches.length) * 100)
      : 0
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>loading outreach data...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>outreach tracking</h2>

      {/* stats */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>
            total reached out
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>
            pending reply
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffa500' }}>{stats.pending}</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>
            replied
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ff88' }}>{stats.replied}</div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>
            reply rate
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.replyRate}%</div>
        </div>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'all' ? '#00ff88' : '#2a2a2a',
            color: filter === 'all' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          all ({outreaches.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'pending' ? '#ffa500' : '#2a2a2a',
            color: filter === 'pending' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          pending ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('replied')}
          style={{
            padding: '0.5rem 1rem',
            background: filter === 'replied' ? '#00ff88' : '#2a2a2a',
            color: filter === 'replied' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          replied ({stats.replied})
        </button>
      </div>

      {/* list */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {filteredOutreaches.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            no outreach found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>channel</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>sent</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutreaches.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={{ padding: '1rem' }}>
                    <a
                      href={o.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00ff88', textDecoration: 'none' }}
                    >
                      {o.candidate_name}
                    </a>
                    {o.email && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                        {o.email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: o.channel === 'email' ? '#4a4a00' : '#004a4a',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {o.channel || 'unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {o.replied ? (
                      <span style={{ color: '#00ff88' }}>✓ replied</span>
                    ) : (
                      <span style={{ color: '#ffa500' }}>pending</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#888' }}>
                    {o.sent_at ? new Date(o.sent_at).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {!o.replied && (
                      <button
                        onClick={() => markReplied(o.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#00ff88',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        mark replied
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
