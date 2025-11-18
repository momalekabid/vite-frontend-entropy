import { useState, useEffect, useRef } from 'react'
import { Building2, Users, Calendar, FileText, Mail, Search, Download, TrendingUp, DollarSign, Activity, Globe, Linkedin, ExternalLink, StickyNote, CheckCircle2, RefreshCw, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import CandidateCard from './CandidateCard'
import AppSidebar from './components/AppSidebar'
import RecentSearches from './components/RecentSearches'
import DashboardCard from './components/DashboardCard'
import SearchSuggestions from './components/SearchSuggestions'
import StarRating from './components/StarRating'
import Settings from './components/Settings'
import Memory from './components/Memory'
import { RECURRING_SEARCHES } from './constants/recurringSearches'
import './App.css'

// transcript interfaces
interface TranscriptSegment {
  speech: string
  start_time: number
  end_time: number
  speaker: {
    name: string
  }
}

interface Transcript {
  id?: number
  meeting_id: string
  meeting_title: string
  recording_id: string
  raw_transcript: string
  transcript: TranscriptSegment[]
  web_url: string
  created_at?: string
  meeting_description?: string
  meeting_start?: any
  meeting_end?: any
  participants?: any[]
  ai_tags?: string[]
  ai_highlights?: string[]
  ai_sentiment?: string
  ai_analysis?: {
    tags?: string[]
    summary?: string
    highlights?: string[]
    founder_signal_score?: number
    investment_thesis?: string
  }
}

interface TranscriptsApiResponse {
  success: boolean
  count: number
  transcripts: Transcript[]
}

// attio record interfaces
interface AttioRecord {
  record_id: string
  workspace_id: string
  object_id: string
  object_slug: string
  record_text: string
  record_image?: string
  email_addresses?: string[]
  phone_numbers?: string[]
  domains?: string[]
}

interface RecordTranscriptsResponse {
  success: boolean
  object_slug: string
  record_id: string
  count: number
  transcripts: Transcript[]
}

// dashboard interfaces
interface Stats {
  companies: number
  people: number
  emails: number
  meetings: number
  transcripts: number
}

interface Company {
  id: number
  name: string
  domain?: string
  sector?: string
  stage?: string
  valuation?: number
  description?: string
  linkedin_url?: string
  website_url?: string
}

interface Person {
  id: number
  name: string
  email?: string
  role?: string
  linkedin_url?: string
  company_name?: string
}

interface Meeting {
  id: number
  title: string
  description?: string
  start_datetime?: string
  end_datetime?: string
  has_transcript: boolean
  web_url?: string
  participant_count: number
}

interface Email {
  id: number
  subject?: string
  from_email: string
  sent_at?: string
  body_preview?: string
  person_name?: string
  company_name?: string
}

interface DriveFile {
  id: number
  name: string
  mime_type?: string
  size?: number
  file_type?: string
  drive_id?: string
  drive_url?: string
  extracted_text_preview?: string
  page_count?: number
  drive_created_time?: string
  drive_modified_time?: string
}

interface Note {
  id: number
  attio_note_id: string
  title: string
  content_plaintext: string
  content_markdown: string
  parent_object: string
  parent_record_id: string
  person_id?: number
  company_id?: number
  attio_meeting_id?: string
  web_url?: string
  note_created_at?: string
  created_at: string
}

interface List {
  id: number
  attio_list_id: string
  api_slug: string
  name: string
  parent_object: string
  workspace_access?: string
  list_created_at?: string
  entry_count: number
  created_at: string
}

interface Candidate {
  id: number
  name: string
  headline?: string
  location?: string
  current_company?: string
  current_title?: string
  company_headcount?: string
  tenure_years?: number
  detected_industries: string[]
  linkedin_url?: string
  ai_reasoning?: string
  ai_key_strengths: string[]
  ai_concerns: string[]
  ai_talking_points: string[]
  created_at?: string
}

interface SearchJob {
  job_id: string
  query: string
  status: string
  progress: {
    searches_completed: number
    searches_total: number
    candidates_found: number
    candidates_filtered: number
    current_phase: string
  }
  created_at?: string
  started_at?: string
  completed_at?: string
  candidate_count: number
}

interface DBTranscript {
  id: number
  meeting_title: string
  meeting_start?: string
  raw_transcript: string
  web_url?: string
  segment_count: number
  speakers: string[]
}

interface SearchResults {
  companies: Company[]
  people: Person[]
  meetings: Meeting[]
  transcripts: DBTranscript[]
  total_results: number
}

interface SyncProgress {
  is_syncing: boolean
  current_step: string
  current_operation: string
  companies: number
  people: number
  meetings: number
  transcripts: number
  emails: number
  documents: number
  lists: number
  notes: number
  total_items: number
  processed_items: number
  progress_percentage: number
  started_at: string | null
  last_updated: string | null
  estimated_completion: string | null
}

// group transcript segments by speaker for better readability
interface GroupedSegment {
  speaker: string
  text: string
  start_time: number
  end_time: number
}

function groupTranscriptByParagraph(segments: TranscriptSegment[]): GroupedSegment[] {
  if (!segments || segments.length === 0) return []

  const grouped: GroupedSegment[] = []
  let current: GroupedSegment | null = null

  for (const segment of segments) {
    // if same speaker, concatenate
    if (current && current.speaker === segment.speaker.name) {
      current.text += ' ' + segment.speech
      current.end_time = segment.end_time
    } else {
      // new speaker, create new group
      if (current) grouped.push(current)
      current = {
        speaker: segment.speaker.name,
        text: segment.speech,
        start_time: segment.start_time,
        end_time: segment.end_time
      }
    }
  }

  // push last group
  if (current) grouped.push(current)

  return grouped
}

// extract first name from email address
function extractNameFromEmail(email: string): string {
  // extract part before @
  const localPart = email.split('@')[0]

  // split by common separators (., _, -)
  const parts = localPart.split(/[._-]/)

  // capitalize first part (first name)
  const firstName = parts[0]
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}

function App() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transcripts' | 'browse' | 'candidates' | 'settings' | 'memory'>('dashboard')

  // autonomous search queue
  interface QueuedSearch {
    id: string
    query: string
    nextRunTime: Date
    interval: string
  }

  const [queuedSearches, setQueuedSearches] = useState<QueuedSearch[]>([
    {
      id: '1',
      query: 'ai founders from top labs',
      nextRunTime: new Date(Date.now() + 30 * 60 * 1000),
      interval: '30 mins'
    },
    {
      id: '2',
      query: 'robotics engineers from defense companies',
      nextRunTime: new Date(Date.now() + 60 * 60 * 1000),
      interval: '1 hour'
    },
    {
      id: '3',
      query: 'climate tech founders with technical backgrounds',
      nextRunTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      interval: '3 hours'
    }
  ])

  const removeQueuedSearch = (id: string) => {
    setQueuedSearches(prev => prev.filter(s => s.id !== id))
  }

  // force re-render every minute to update countdowns
  const [, setCountdownTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTick(prev => prev + 1)
    }, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  // universal search
  const [universalSearchQuery, setUniversalSearchQuery] = useState('')
  const [universalSearchResults, setUniversalSearchResults] = useState<SearchResults | null>(null)
  const [universalSearchLoading, setUniversalSearchLoading] = useState(false)

  // transcript state
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [transcriptsLoading, setTranscriptsLoading] = useState(true)
  const [transcriptsError, setTranscriptsError] = useState<string | null>(null)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set())
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState('')

  // direct transcript fetch
  const [directMeetingId, setDirectMeetingId] = useState('c6bbe566-3172-4a2b-b167-e310f9bc6049')
  const [directRecordingId, setDirectRecordingId] = useState('c79277c4-37ab-4c61-b4bb-96e14ebee6e8')
  const [directTranscript, setDirectTranscript] = useState<Transcript | null>(null)
  const [directLoading, setDirectLoading] = useState(false)

  // attio search state
  const [attioSearchQuery, setAttioSearchQuery] = useState('')
  const [attioSearchResults, setAttioSearchResults] = useState<AttioRecord[]>([])
  const [attioSearchLoading, setAttioSearchLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttioRecord | null>(null)
  const [recordTranscripts, setRecordTranscripts] = useState<Transcript[]>([])
  const [recordTranscriptsLoading, setRecordTranscriptsLoading] = useState(false)

  // dashboard state
  const [stats, setStats] = useState<Stats>({ companies: 0, people: 0, emails: 0, meetings: 0, transcripts: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    is_syncing: false,
    current_step: '',
    current_operation: '',
    companies: 0,
    people: 0,
    meetings: 0,
    transcripts: 0,
    emails: 0,
    documents: 0,
    lists: 0,
    notes: 0,
    total_items: 0,
    processed_items: 0,
    progress_percentage: 0,
    started_at: null,
    last_updated: null,
    estimated_completion: null
  })

  // browse state
  const [browseCategory, setBrowseCategory] = useState<'companies' | 'people' | 'meetings' | 'emails' | 'files' | 'notes' | 'lists'>('companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())

  // candidates state
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searchJobs, setSearchJobs] = useState<SearchJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [reapplyingFilter, setReapplyingFilter] = useState(false)
  const [filterProgress, setFilterProgress] = useState<{current: number, total: number} | null>(null)
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [candidatesSubTab, setCandidatesSubTab] = useState<'searchYourself' | 'recurringSearches'>('searchYourself')
  const [recurringSearchCandidates, setRecurringSearchCandidates] = useState<Record<string, Candidate[]>>({})

  // transcript analysis state
  const [analyzingTranscripts, setAnalyzingTranscripts] = useState<Set<number>>(new Set())

  // track previous sync state
  const prevSyncingRef = useRef(false)

  // track active search polling interval
  const searchPollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTranscripts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/transcripts-live`)

      if (!response.ok) {
        throw new Error(`http ${response.status}: ${response.statusText}`)
      }

      const data: TranscriptsApiResponse = await response.json()

      if (data.success) {
        setTranscripts(data.transcripts)
        console.log(`fetched ${data.count} transcripts`)
        setTranscriptsError(null)
      } else {
        setTranscriptsError('failed to fetch transcripts')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setTranscriptsError(`backend not running or cors issue: ${errorMsg}`)
      console.error('transcript fetch error:', err)
    } finally {
      setTranscriptsLoading(false)
    }
  }

  const fetchDirectTranscript = async () => {
    if (!directMeetingId || !directRecordingId) {
      console.error('please enter both meeting id and recording id')
      return
    }

    setDirectLoading(true)
    try {
      const url = `${API_BASE}/api/attio/meetings/${directMeetingId}/transcript?recording_id=${directRecordingId}`
      console.log('fetching transcript from:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`http ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        const transcript: Transcript = {
          meeting_id: data.meeting_id,
          meeting_title: 'direct fetch',
          recording_id: data.recording_id,
          raw_transcript: data.raw_transcript,
          transcript: data.transcript,
          web_url: data.web_url
        }
        setDirectTranscript(transcript)
        console.log('transcript fetched successfully')
      } else {
        console.error(`failed to fetch transcript: ${data.error || 'unknown error'}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`error fetching transcript: ${errorMsg}`)
      console.error('direct fetch error:', err)
    } finally {
      setDirectLoading(false)
    }
  }

  const searchAttioRecords = async () => {
    if (!attioSearchQuery.trim()) return

    setAttioSearchLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/records/search?query=${encodeURIComponent(attioSearchQuery)}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setAttioSearchResults(data.results)
      }
    } catch (err) {
      console.error('error searching attio records:', err)
    } finally {
      setAttioSearchLoading(false)
    }
  }

  const fetchRecordTranscripts = async (record: AttioRecord) => {
    setSelectedRecord(record)
    setRecordTranscriptsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/records/${record.object_slug}/${record.record_id}/transcripts`)
      const data: RecordTranscriptsResponse = await response.json()

      if (data.success) {
        setRecordTranscripts(data.transcripts)
      }
    } catch (err) {
      console.error('error fetching record transcripts:', err)
    } finally {
      setRecordTranscriptsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stats`)
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('error fetching stats:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data: SearchResults = await response.json()
      setSearchResults(data)
    } catch (err) {
      console.error('search error:', err)
    }
  }

  const triggerSync = async () => {
    try {
      await fetch(`${API_BASE}/api/sync`, { method: 'POST' })
      console.log('sync triggered')
      // immediately fetch progress to start polling
      fetchSyncProgress()
    } catch (err) {
      console.error('sync error:', err)
    }
  }

  const fetchSyncProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sync-progress`)
      const data = await response.json()
      setSyncProgress(data)
    } catch (err) {
      console.error('error fetching sync progress:', err)
    }
  }

  // poll for sync status when syncing
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    if (syncProgress.is_syncing) {
      prevSyncingRef.current = true
      // poll every 3 seconds to check if sync is done
      pollInterval = setInterval(() => {
        fetchSyncProgress()
      }, 3000)
    } else if (prevSyncingRef.current) {
      // sync just finished, refresh data
      prevSyncingRef.current = false
      fetchTranscripts()
      fetchStats()
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [syncProgress.is_syncing])

  const fetchBrowseData = async () => {
    setBrowseLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/${browseCategory}?limit=50`)
      const data = await response.json()

      if (browseCategory === 'companies') {
        setCompanies(data.companies || [])
      } else if (browseCategory === 'people') {
        setPeople(data.people || [])
      } else if (browseCategory === 'meetings') {
        setMeetings(data.meetings || [])
      } else if (browseCategory === 'emails') {
        setEmails(data.emails || [])
      } else if (browseCategory === 'files') {
        setFiles(data.files || [])
      } else if (browseCategory === 'notes') {
        setNotes(data.notes || [])
      } else if (browseCategory === 'lists') {
        setLists(data.lists || [])
      }
    } catch (err) {
      console.error('error fetching browse data:', err)
    } finally {
      setBrowseLoading(false)
    }
  }

  const toggleNote = (noteId: number) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedNotes(newExpanded)
  }

  const toggleTranscript = (recordingId: string) => {
    const newExpanded = new Set(expandedTranscripts)
    if (newExpanded.has(recordingId)) {
      newExpanded.delete(recordingId)
    } else {
      newExpanded.add(recordingId)
    }
    setExpandedTranscripts(newExpanded)
  }

  const filterTranscripts = (transcripts: Transcript[]) => {
    if (!transcriptSearchQuery.trim()) return transcripts

    const query = transcriptSearchQuery.toLowerCase()
    return transcripts.filter(t =>
      t.meeting_title.toLowerCase().includes(query) ||
      t.raw_transcript.toLowerCase().includes(query) ||
      t.transcript.some(seg => seg.speech.toLowerCase().includes(query))
    )
  }

  const handleUniversalSearch = async () => {
    if (!universalSearchQuery.trim()) return

    setUniversalSearchLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(universalSearchQuery)}`)
      const data: SearchResults = await response.json()
      setUniversalSearchResults(data)
    } catch (err) {
      console.error('universal search error:', err)
    } finally {
      setUniversalSearchLoading(false)
    }
  }

  const fetchCandidates = async (jobId?: string) => {
    const targetJobId = jobId || selectedJobId
    if (!targetJobId) return

    try {
      const response = await fetch(`${API_BASE}/api/search-jobs/${targetJobId}`)

      // if job was deleted (404), stop polling and clear selection
      if (response.status === 404) {
        console.warn(`job ${targetJobId} not found, stopping polling`)
        if (searchPollIntervalRef.current) {
          clearInterval(searchPollIntervalRef.current)
          searchPollIntervalRef.current = null
        }
        if (targetJobId === selectedJobId) {
          setSelectedJobId(null)
          setCandidates([])
        }
        return
      }

      const data = await response.json()
      if (data.success && data.candidates) {
        // if jobId was explicitly passed, always update (user action)
        // if no jobId passed (background polling), only update if it matches selected job
        if (jobId || targetJobId === selectedJobId) {
          setCandidates(data.candidates)
        }
      }
    } catch (err) {
      console.error('error fetching candidates:', err)
    }
  }

  // reapply memory filter to existing candidates (progressive batch processing)
  const reapplyMemoryFilter = async () => {
    try {
      if (!selectedJobId) {
        alert('please select a search first')
        return
      }

      setReapplyingFilter(true)

      // check if job was already paused before we started
      const currentJob = searchJobs.find(j => j.job_id === selectedJobId)
      const wasAlreadyPaused = currentJob?.status === 'paused'

      // pause the search (only if it's running)
      if (!wasAlreadyPaused) {
        try {
          await fetch(`${API_BASE}/api/search-jobs/${selectedJobId}/pause`, { method: 'POST' })
        } catch (pauseErr) {
          console.warn('failed to pause search:', pauseErr)
        }
      }

      // stop polling
      if (searchPollIntervalRef.current) {
        clearInterval(searchPollIntervalRef.current)
        searchPollIntervalRef.current = null
      }

      // get total count first for THIS SPECIFIC JOB
      const countResponse = await fetch(`${API_BASE}/api/outreach/reapply-memory-filter/count?job_id=${selectedJobId}`)
      const countData = await countResponse.json()

      if (!countData.success) {
        throw new Error('failed to get candidate count')
      }

      const total = countData.total
      let processed = 0
      let totalFiltered = 0

      // process batches until done
      while (true) {
        const batchResponse = await fetch(`${API_BASE}/api/outreach/reapply-memory-filter/batch?job_id=${selectedJobId}`, {
          method: 'POST'
        })
        const batchData = await batchResponse.json()

        if (!batchData.success) {
          throw new Error('batch processing failed')
        }

        processed += batchData.processed
        totalFiltered += batchData.filtered_count

        // update progress
        setFilterProgress({ current: processed, total })

        // refresh candidates to show filtered ones disappearing
        await fetchCandidates(selectedJobId)

        // check if done
        if (batchData.done) {
          break
        }
      }

      // clear progress - filtering complete
      setFilterProgress(null)

      // resume the search (only if we paused it)
      if (!wasAlreadyPaused) {
        try {
          await fetch(`${API_BASE}/api/search-jobs/${selectedJobId}/resume`, { method: 'POST' })
        } catch (resumeErr) {
          console.warn('failed to resume search:', resumeErr)
        }

        // restart polling
        startSearchPolling(selectedJobId)
      }

    } catch (err) {
      console.error('error reapplying memory filter:', err)
      alert('error reapplying memory filter')
      setFilterProgress(null)

      // make sure to resume even on error (only if we paused it)
      if (!wasAlreadyPaused) {
        try {
          await fetch(`${API_BASE}/api/search-jobs/${selectedJobId}/resume`, { method: 'POST' })
          startSearchPolling(selectedJobId)
        } catch (resumeErr) {
          console.warn('failed to resume search after error:', resumeErr)
        }
      }
    } finally {
      setReapplyingFilter(false)
    }
  }

  // start polling for a search job, clearing any existing poll
  const startSearchPolling = (jobId: string) => {
    // clear any existing polling interval
    if (searchPollIntervalRef.current) {
      clearInterval(searchPollIntervalRef.current)
      searchPollIntervalRef.current = null
    }

    // start new polling interval
    searchPollIntervalRef.current = setInterval(() => {
      fetchSearchJobs()
      fetchCandidates(jobId)
    }, 2000)

    // stop polling after 5 minutes
    setTimeout(() => {
      if (searchPollIntervalRef.current) {
        clearInterval(searchPollIntervalRef.current)
        searchPollIntervalRef.current = null
      }
    }, 300000)
  }

  const fetchSearchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/search-jobs`)
      const data = await response.json()
      if (data.success) {
        // only update if jobs count or status changed
        setSearchJobs(prev => {
          const newJobs = data.jobs || []
          if (prev.length === newJobs.length) {
            // check if any status changed
            const hasChanges = prev.some((p, i) =>
              p.status !== newJobs[i]?.status ||
              p.candidate_count !== newJobs[i]?.candidate_count
            )
            if (!hasChanges) return prev
          }
          return newJobs
        })
      }
    } catch (err) {
      console.error('error fetching search jobs:', err)
    }
  }

  const fetchSearchSuggestions = async (jobId: string) => {
    try {
      setSuggestionsLoading(true)
      const response = await fetch(`${API_BASE}/api/search-jobs/${jobId}/suggestions`)
      const data = await response.json()
      if (data.success && data.suggestions) {
        setSearchSuggestions(data.suggestions)
      }
    } catch (err) {
      console.error('error fetching suggestions:', err)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const submitCandidateSearch = async () => {
    if (!candidateSearchQuery.trim()) return

    const query = candidateSearchQuery
    setCandidateSearchQuery('')
    setCandidatesLoading(true)
    setSearchSuggestions([])
    setCandidates([])

    try {
      const response = await fetch(`${API_BASE}/api/search-jobs?query=${encodeURIComponent(query)}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        const jobId = data.job_id
        // set selected job to the newly created search
        setSelectedJobId(jobId)
        // refresh jobs list immediately
        await fetchSearchJobs()
        // fetch candidates for this job
        await fetchCandidates(jobId)
        // fetch suggestions after a short delay (let some results come in first)
        setTimeout(() => fetchSearchSuggestions(jobId), 5000)
        // start polling for this search
        startSearchPolling(jobId)
      } else {
        console.error('search failed:', data)
      }
    } catch (err) {
      console.error('error submitting search:', err)
    } finally {
      setCandidatesLoading(false)
    }
  }

  const cancelSearchJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/search-jobs/${jobId}/pause`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        fetchSearchJobs()
      } else {
        console.error('failed to pause search')
      }
    } catch (err) {
      console.error('error pausing search job:', err)
    }
  }

  const resumeSearchJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/search-jobs/${jobId}/resume`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        fetchSearchJobs()
        // restart polling if this is the selected job
        if (jobId === selectedJobId) {
          startSearchPolling(jobId)
        }
      } else {
        console.error('failed to resume search')
      }
    } catch (err) {
      console.error('error resuming search job:', err)
    }
  }

  const deleteSearchJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/search-jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // remove job from list
        setSearchJobs(searchJobs.filter(job => job.job_id !== jobId))
        // clear candidates from deleted job
        setCandidates(candidates.filter(c => {
          const jobSearchResults = searchJobs.find(j => j.job_id === jobId)
          return !jobSearchResults
        }))
        console.log('search job deleted successfully')
      } else {
        console.error(`failed to delete search: ${data.error || 'unknown error'}`)
      }
    } catch (err) {
      console.error('error deleting search job:', err)
    }
  }

  const augmentTranscript = async (transcriptId: number) => {
    try {
      // mark as analyzing
      setAnalyzingTranscripts(prev => new Set([...prev, transcriptId]))

      const response = await fetch(`${API_BASE}/api/transcripts/${transcriptId}/augment`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        // update transcript with analysis
        setTranscripts(transcripts.map(t => {
          if (t.id === transcriptId) {
            return {
              ...t,
              ai_analysis: data.analysis,
              ai_tags: data.analysis.tags || []
            }
          }
          return t
        }))
      } else {
        console.error('failed to analyze transcript')
      }
    } catch (err) {
      console.error('error augmenting transcript:', err)
    } finally {
      setAnalyzingTranscripts(prev => {
        const newSet = new Set(prev)
        newSet.delete(transcriptId)
        return newSet
      })
    }
  }

  useEffect(() => {
    // fetch initial data on mount
    fetchStats()
    fetchSearchJobs()
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats()
      fetchSearchJobs()
      // fetch suggestions from most recent search for dashboard display
      const fetchDashboardSuggestions = async () => {
        const response = await fetch(`${API_BASE}/api/search-jobs`)
        const data = await response.json()
        if (data.success && data.jobs.length > 0) {
          // get suggestions from most recent completed search
          const recentJob = data.jobs.find((j: any) => j.status === 'completed')
          if (recentJob) {
            fetchSearchSuggestions(recentJob.job_id)
          }
        }
      }
      fetchDashboardSuggestions()
    } else if (activeTab === 'transcripts') {
      fetchTranscripts()
      // removed auto-polling to prevent errors
    } else if (activeTab === 'browse') {
      fetchBrowseData()
    } else if (activeTab === 'candidates') {
      fetchCandidates()
      fetchSearchJobs()
    }
  }, [activeTab, browseCategory])

  return (
    <div className="app-container">
      <AppSidebar activeTab={activeTab} onNavChange={setActiveTab} />
      <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>vc copilot</h1>

          {/* universal search bar */}
          <div className="universal-search">
            <input
              type="text"
              value={universalSearchQuery}
              onChange={(e) => setUniversalSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUniversalSearch()}
              placeholder="search everything: companies, people, meetings, transcripts..."
            />
            <button onClick={handleUniversalSearch} disabled={universalSearchLoading}>
              {universalSearchLoading ? 'searching...' : <Search size={20} />}
            </button>
          </div>

          {/* status bar */}
          <div className="status-bar">
            <div className="stat-pill">
              <Building2 size={14} />
              <span>{stats.companies}</span>
            </div>
            <div className="stat-pill">
              <Users size={14} />
              <span>{stats.people}</span>
            </div>
            <div className="stat-pill">
              <Mail size={14} />
              <span>{stats.emails}</span>
            </div>
            <div className="stat-pill">
              <Calendar size={14} />
              <span>{stats.meetings}</span>
            </div>
            <div className="stat-pill">
              <FileText size={14} />
              <span>{stats.transcripts}</span>
            </div>
          </div>
        </div>
      </header>

      {/* dashboard view */}
      {activeTab === 'dashboard' && (
        <div className="tab-content dashboard-content">
          {/* stats overview */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <DashboardCard
              title="Companies"
              value={stats.companies}
              icon={<Building2 size={24} />}
            />
            <DashboardCard
              title="People"
              value={stats.people}
              icon={<Users size={24} />}
            />
            <DashboardCard
              title="Emails"
              value={stats.emails}
              icon={<Mail size={24} />}
            />
            <DashboardCard
              title="Transcripts"
              value={stats.transcripts}
              icon={<FileText size={24} />}
            />
          </div>

          {/* main dashboard grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <RecentSearches
                searches={searchJobs.map(job => ({
                  job_id: job.job_id,
                  query: job.query,
                  status: job.status,
                  candidate_count: job.candidate_count,
                  created_at: job.created_at
                }))}
                onNewSearch={() => setActiveTab('candidates')}
                onSearchClick={(jobId) => {
                  setActiveTab('candidates')
                  setSelectedJobId(jobId)
                  fetchCandidates(jobId)
                }}
              />

              {/* autonomous search queue - temporarily disabled, needs proper implementation */}
              {/* <div className="border border-border rounded-lg p-6 bg-card">
                <h2 className="text-lg font-medium text-foreground mb-6">queued autonomous searches</h2>

                {queuedSearches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    no queued searches. searches will run automatically based on your portfolio.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {queuedSearches.map(search => {
                      const now = new Date()
                      const timeLeft = search.nextRunTime.getTime() - now.getTime()
                      const minutes = Math.floor(timeLeft / 60000)
                      const hours = Math.floor(minutes / 60)
                      const displayTime = hours > 0
                        ? `${hours}h ${minutes % 60}m`
                        : `${minutes}m`

                      return (
                        <div
                          key={search.id}
                          className="border border-border rounded-lg p-4 space-y-2 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-mono text-sm text-foreground mb-1">{search.query}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>⏱ next run in {displayTime}</span>
                                <span>•</span>
                                <span>repeats every {search.interval}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeQueuedSearch(search.id)}
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                              title="stop this search"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div> */}
            </div>
            <div>
              {suggestionsLoading ? (
                <div className="suggestions-loading">generating intelligent suggestions...</div>
              ) : (
                <SearchSuggestions
                    candidateCount={candidates.length}
                    suggestions={searchSuggestions.map((text, i) => ({
                      id: String(i),
                      text,
                      category: 'keyword'
                    }))}
                    onSearch={async (suggestion) => {
                      // use suggestion as new search query
                      const suggestionQuery = suggestion.text
                      setCandidateSearchQuery('')
                      setCandidatesLoading(true)

                      // remove only the clicked suggestion, keep the rest
                      setSearchSuggestions(prev => prev.filter(s => s !== suggestionQuery))

                      setCandidates([])

                      try {
                        const response = await fetch(`${API_BASE}/api/search-jobs?query=${encodeURIComponent(suggestionQuery)}`, {
                          method: 'POST'
                        })
                        const data = await response.json()
                        if (data.success) {
                          const jobId = data.job_id
                          setSelectedJobId(jobId)
                          // fetch jobs list in background (non-blocking)
                          fetchSearchJobs()
                          // fetch candidates for this job
                          await fetchCandidates(jobId)
                          // start polling for this search
                          startSearchPolling(jobId)
                          // don't regenerate suggestions - just let the user use the remaining ones
                        }
                      } catch (err) {
                        console.error('error submitting suggestion search:', err)
                      } finally {
                        setCandidatesLoading(false)
                      }
                    }}
                  />
                )}
              </div>
          </div>
        </div>
      )}

      {/* universal search results */}
      {universalSearchResults && universalSearchResults.total_results > 0 && (
        <div className="universal-search-results">
          <div className="search-results-header">
            <h2>search results ({universalSearchResults.total_results})</h2>
            <button onClick={() => setUniversalSearchResults(null)} className="close-results">✕</button>
          </div>

          {universalSearchResults.companies.length > 0 && (
            <div className="result-section">
              <h3>companies ({universalSearchResults.companies.length})</h3>
              <div className="results-grid">
                {universalSearchResults.companies.map(company => (
                  <div
                    key={company.id}
                    className="result-card"
                    onClick={() => {
                      setActiveTab('browse')
                      setBrowseCategory('companies')
                      setUniversalSearchResults(null)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{company.name}</h4>
                    {company.domain && <p>🌐 {company.domain}</p>}
                    {company.sector && <p>📊 {company.sector}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {universalSearchResults.people.length > 0 && (
            <div className="result-section">
              <h3>people ({universalSearchResults.people.length})</h3>
              <div className="results-grid">
                {universalSearchResults.people.map(person => (
                  <div
                    key={person.id}
                    className="result-card"
                    onClick={() => {
                      setActiveTab('browse')
                      setBrowseCategory('people')
                      setUniversalSearchResults(null)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{person.name}</h4>
                    {person.email && <p>📧 {person.email}</p>}
                    {person.company_name && <p>🏢 {person.company_name}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {universalSearchResults.meetings.length > 0 && (
            <div className="result-section">
              <h3>meetings ({universalSearchResults.meetings.length})</h3>
              <div className="results-grid">
                {universalSearchResults.meetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="result-card"
                    onClick={() => {
                      setActiveTab('browse')
                      setBrowseCategory('meetings')
                      setUniversalSearchResults(null)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{meeting.title}</h4>
                    {meeting.description && <p>{meeting.description}</p>}
                    {meeting.has_transcript && <span className="transcript-badge">📝</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {universalSearchResults.transcripts.length > 0 && (
            <div className="result-section">
              <h3>transcripts ({universalSearchResults.transcripts.length})</h3>
              <div className="results-grid">
                {universalSearchResults.transcripts.map(transcript => (
                  <div
                    key={transcript.id}
                    className="result-card"
                    onClick={() => {
                      setActiveTab('transcripts')
                      setUniversalSearchResults(null)
                      // find the full transcript to get recording_id
                      const fullTranscript = transcripts.find(t => t.id === transcript.id)
                      if (fullTranscript) {
                        // expand this transcript
                        setExpandedTranscripts(prev => {
                          const newSet = new Set(prev)
                          newSet.add(fullTranscript.recording_id)
                          return newSet
                        })
                        // scroll to it
                        setTimeout(() => {
                          const transcriptElement = document.querySelector(`[data-transcript-id="${transcript.id}"]`)
                          if (transcriptElement) {
                            transcriptElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }
                        }, 100)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{transcript.meeting_title}</h4>
                    <p className="transcript-preview">{transcript.raw_transcript.substring(0, 150)}...</p>
                    <p className="meta-info">
                      {transcript.speakers.length > 0 && `speakers: ${transcript.speakers.join(', ')}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transcripts' && (
        <div className="tab-content">
          <div className="stats-bar">
            <div className="stat">
              transcripts: {transcripts.length}
            </div>
          </div>

          {/* transcript search bar */}
          <div className="transcript-search-section">
            <div className="search-bar">
              <input
                type="text"
                value={transcriptSearchQuery}
                onChange={(e) => setTranscriptSearchQuery(e.target.value)}
                placeholder="search transcripts by title or content..."
              />
              <Search size={20} />
            </div>
          </div>

          {/* sync section */}
          <div className="sync-section" style={{ display: 'none' }}>
            <h3>sync from attio</h3>
            <p className="hint">sync companies, people, meetings, and transcripts from attio</p>
            <button onClick={triggerSync} disabled={syncProgress.is_syncing} className="sync-button">
              {syncProgress.is_syncing ? 'syncing...' : 'resync'}
            </button>

            {syncProgress.is_syncing && (
              <div className="sync-loading">
                <div className="spinner"></div>
                <p>syncing data from attio...</p>
              </div>
            )}
          </div>

          <div className="content">
            {transcriptsLoading ? (
              <div className="loading">loading transcripts...</div>
            ) : transcriptsError ? (
              <div className="error">
                {transcriptsError}
                <p className="hint">make sure backend is running: cd backend && python main.py</p>
              </div>
            ) : (
              <div className="transcripts-list">
                {filterTranscripts(transcripts).map((transcript) => {
                  const isExpanded = expandedTranscripts.has(transcript.recording_id)
                  return (
                    <div key={transcript.recording_id} className="transcript-card" data-transcript-id={transcript.id}>
                      <div
                        className="transcript-header clickable"
                        onClick={() => toggleTranscript(transcript.recording_id)}
                      >
                        <div className="transcript-title-section">
                          <h2>
                            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                            {transcript.meeting_title}
                          </h2>
                          {/* founder signal hidden - not accurate enough */}
                        </div>
                        <div className="transcript-meta">
                          {transcript.created_at && <span>{new Date(transcript.created_at).toLocaleDateString()}</span>}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (transcript.id) {
                                augmentTranscript(transcript.id)
                              }
                            }}
                            disabled={transcript.id ? analyzingTranscripts.has(transcript.id) : false}
                            className="augment-button"
                            title="analyze with claude to generate tags and highlights"
                          >
                            {transcript.id && analyzingTranscripts.has(transcript.id) ? '⏳ analyzing...' : '✨ augment'}
                          </button>
                          {transcript.web_url && (
                            <a
                              href={transcript.web_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              view in attio →
                            </a>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <>
                          {/* vc-focused analysis section */}
                          {transcript.ai_analysis && (
                            <div className="vc-analysis-section">
                              {/* tags */}
                              {transcript.ai_analysis.tags && transcript.ai_analysis.tags.length > 0 && (
                                <div className="analysis-tags">
                                  <h4>key signals</h4>
                                  <div className="tags-grid">
                                    {transcript.ai_analysis.tags.map((tag, idx) => (
                                      <span key={idx} className="vc-tag">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* summary & thesis */}
                              {(transcript.ai_analysis.summary || transcript.ai_analysis.investment_thesis) && (
                                <div className="analysis-summary">
                                  {transcript.ai_analysis.summary && (
                                    <div className="summary-box">
                                      <h4>summary</h4>
                                      <p>{transcript.ai_analysis.summary}</p>
                                    </div>
                                  )}
                                  {transcript.ai_analysis.investment_thesis && (
                                    <div className="thesis-box">
                                      <h4>investment thesis</h4>
                                      <p>{transcript.ai_analysis.investment_thesis}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* highlights */}
                              {transcript.ai_analysis.highlights && transcript.ai_analysis.highlights.length > 0 && (
                                <div className="analysis-highlights">
                                  <h4>key quotes</h4>
                                  <div className="quotes-list">
                                    {transcript.ai_analysis.highlights.map((highlight, idx) => (
                                      <div key={idx} className="quote-item">
                                        <span className="quote-icon">"</span>
                                        <p>{highlight}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* condensed transcript (collapsed by default) */}
                          <details className="condensed-transcript">
                            <summary>view full transcript ({Math.ceil((transcript.raw_transcript?.length || 0) / 50)} minutes)</summary>
                            <div className="transcript-content">
                              {groupTranscriptByParagraph(transcript.transcript).slice(0, 20).map((group, idx) => (
                                <div key={idx} className="transcript-paragraph">
                                  <div className="speaker-info">
                                    <strong>{group.speaker}</strong>
                                  </div>
                                  <p>{group.text}</p>
                                </div>
                              ))}
                              {groupTranscriptByParagraph(transcript.transcript).length > 20 && (
                                <p className="transcript-truncated">... ({groupTranscriptByParagraph(transcript.transcript).length - 20} more segments)</p>
                              )}
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  )
                })}
                {transcripts.length === 0 && (
                  <div className="empty-state">
                    <p>no transcripts available yet</p>
                    <p className="hint">
                      transcripts will appear here as they are synced from attio.
                      go to the dashboard tab to trigger a sync.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'browse' && (
        <div className="tab-content">
          <div className="browse-header">
            <div className="category-tabs">
              <button
                className={`category-tab ${browseCategory === 'companies' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('companies')}
              >
                companies
              </button>
              <button
                className={`category-tab ${browseCategory === 'people' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('people')}
              >
                people
              </button>
              <button
                className={`category-tab ${browseCategory === 'meetings' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('meetings')}
              >
                meetings
              </button>
              <button
                className={`category-tab ${browseCategory === 'emails' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('emails')}
              >
                emails
              </button>
              <button
                className={`category-tab ${browseCategory === 'files' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('files')}
              >
                files
              </button>
              <button
                className={`category-tab ${browseCategory === 'notes' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('notes')}
              >
                notes
              </button>
              <button
                className={`category-tab ${browseCategory === 'lists' ? 'active' : ''}`}
                onClick={() => setBrowseCategory('lists')}
              >
                lists
              </button>
            </div>
          </div>

          {browseLoading ? (
            <div className="loading">loading {browseCategory}...</div>
          ) : (
            <div className="browse-list">
              {browseCategory === 'companies' && (
                <>
                  {companies.length === 0 ? (
                    <div className="empty-state">
                      <Building2 size={48} strokeWidth={1.5} />
                      <p>no companies found. run sync to import data.</p>
                    </div>
                  ) : (
                    companies.map(company => (
                      <div key={company.id} className="company-card">
                        <div className="company-card-header">
                          <div className="company-icon">
                            <Building2 size={24} strokeWidth={2} />
                          </div>
                          <div className="company-title">
                            <h3>{company.name}</h3>
                            {company.stage && <span className="stage-badge">{company.stage}</span>}
                          </div>
                        </div>

                        <div className="company-metrics">
                          {company.sector && (
                            <div className="metric">
                              <Activity size={16} />
                              <span>{company.sector}</span>
                            </div>
                          )}
                          {company.valuation && (
                            <div className="metric">
                              <DollarSign size={16} />
                              <span>${(company.valuation / 1000000).toFixed(1)}m valuation</span>
                            </div>
                          )}
                          {company.domain && (
                            <div className="metric">
                              <Globe size={16} />
                              <span>{company.domain}</span>
                            </div>
                          )}
                        </div>

                        {company.description && (
                          <p className="company-description">{company.description}</p>
                        )}

                        <div className="company-actions">
                          {company.website_url && (
                            <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="action-link">
                              <ExternalLink size={16} />
                              <span>website</span>
                            </a>
                          )}
                          {company.linkedin_url && (
                            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="action-link">
                              <Linkedin size={16} />
                              <span>linkedin</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {browseCategory === 'people' && (
                <>
                  {people.length === 0 ? (
                    <div className="empty-state">
                      <Users size={48} strokeWidth={1.5} />
                      <p>no people found. run sync to import data.</p>
                    </div>
                  ) : (
                    people.map(person => (
                      <div key={person.id} className="person-card">
                        <div className="person-avatar">
                          {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="person-info">
                          <h3>{person.name}</h3>
                          {person.role && <span className="role-badge">{person.role}</span>}

                          <div className="person-details">
                            {person.email && (
                              <div className="detail-item">
                                <Mail size={14} />
                                <span>{person.email}</span>
                              </div>
                            )}
                            {person.company_name && (
                              <div className="detail-item">
                                <Building2 size={14} />
                                <span>{person.company_name}</span>
                              </div>
                            )}
                          </div>

                          {person.linkedin_url && (
                            <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="person-linkedin">
                              <Linkedin size={16} />
                              <span>view profile</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {browseCategory === 'meetings' && (
                <>
                  {meetings.length === 0 ? (
                    <div className="empty-state">
                      <Calendar size={48} strokeWidth={1.5} />
                      <p>no meetings found. run sync to import data.</p>
                    </div>
                  ) : (
                    meetings.map(meeting => (
                      <div key={meeting.id} className="meeting-card">
                        <div className="meeting-header">
                          <div className="meeting-icon">
                            <Calendar size={20} strokeWidth={2} />
                          </div>
                          <div className="meeting-title-section">
                            <h3>{meeting.title}</h3>
                            {meeting.has_transcript && (
                              <span className="transcript-indicator">
                                <FileText size={14} />
                                transcript available
                              </span>
                            )}
                          </div>
                        </div>

                        {meeting.description && (
                          <p className="meeting-description">{meeting.description}</p>
                        )}

                        <div className="meeting-meta">
                          {meeting.start_datetime && (
                            <div className="meta-item">
                              <Calendar size={14} />
                              <span>{formatDistanceToNow(new Date(meeting.start_datetime), { addSuffix: true })}</span>
                            </div>
                          )}
                          <div className="meta-item">
                            <Users size={14} />
                            <span>{meeting.participant_count} participant{meeting.participant_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {meeting.web_url && (
                          <a href={meeting.web_url} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            <ExternalLink size={16} />
                            <span>view in attio</span>
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {browseCategory === 'emails' && (
                <>
                  {emails.length === 0 ? (
                    <div className="empty-state">
                      <Mail size={48} strokeWidth={1.5} />
                      <p>no emails found. run sync to import data.</p>
                    </div>
                  ) : (
                    emails.map(email => (
                      <div key={email.id} className="email-card">
                        <div className="email-header">
                          <Mail size={18} strokeWidth={2} />
                          <h3>{email.subject || '(no subject)'}</h3>
                        </div>

                        <div className="email-from">
                          <span className="from-label">from</span>
                          <span className="from-name">{extractNameFromEmail(email.from_email)}</span>
                          <span className="from-email">{email.from_email}</span>
                        </div>

                        <div className="email-meta-grid">
                          {email.sent_at && (
                            <div className="email-meta-item">
                              <Calendar size={14} />
                              <span>{formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}</span>
                            </div>
                          )}
                          {email.person_name && (
                            <div className="email-meta-item">
                              <Users size={14} />
                              <span>{email.person_name}</span>
                            </div>
                          )}
                          {email.company_name && (
                            <div className="email-meta-item">
                              <Building2 size={14} />
                              <span>{email.company_name}</span>
                            </div>
                          )}
                        </div>

                        {email.body_preview && (
                          <p className="email-preview">{email.body_preview}</p>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {browseCategory === 'files' && (
                <>
                  {files.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={48} strokeWidth={1.5} />
                      <p>no files found. run sync to import data from drive.</p>
                    </div>
                  ) : (
                    files.map(file => (
                      <div key={file.id} className="file-card">
                        <div className="file-icon-large">
                          <FileText size={28} strokeWidth={2} />
                        </div>
                        <div className="file-info">
                          <h3>{file.name}</h3>

                          <div className="file-meta-row">
                            {file.file_type && (
                              <span className="file-type-badge">{file.file_type.toUpperCase()}</span>
                            )}
                            {file.size && (
                              <span className="file-size">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                            {file.page_count && (
                              <span className="file-pages">
                                {file.page_count} page{file.page_count !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {file.extracted_text_preview && (
                            <p className="file-preview">{file.extracted_text_preview}</p>
                          )}

                          <div className="file-dates">
                            {file.drive_created_time && (
                              <div className="file-date-item">
                                <Calendar size={14} />
                                <span>created {formatDistanceToNow(new Date(file.drive_created_time), { addSuffix: true })}</span>
                              </div>
                            )}
                            {file.drive_modified_time && (
                              <div className="file-date-item">
                                <Calendar size={14} />
                                <span>modified {formatDistanceToNow(new Date(file.drive_modified_time), { addSuffix: true })}</span>
                              </div>
                            )}
                          </div>

                          {file.drive_url && (
                            <a href={file.drive_url} target="_blank" rel="noopener noreferrer" className="file-link">
                              <ExternalLink size={16} />
                              <span>open in drive</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {browseCategory === 'notes' && (
                <div className="transcripts-list">
                  {notes.length === 0 ? (
                    <div className="empty-state">
                      <StickyNote size={48} strokeWidth={1.5} />
                      <p>no notes available yet</p>
                      <p className="hint">
                        notes will appear here as they are synced from attio.
                      </p>
                    </div>
                  ) : (
                    notes.map((note) => {
                      const isExpanded = expandedNotes.has(note.id)
                      return (
                        <div key={note.id} className="transcript-card">
                          <div
                            className="transcript-header clickable"
                            onClick={() => toggleNote(note.id)}
                          >
                            <h2>
                              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                              {note.title || '(untitled note)'}
                            </h2>
                            <div className="transcript-meta">
                              <span>{note.parent_object}</span>
                              {note.note_created_at && (
                                <span>{formatDistanceToNow(new Date(note.note_created_at), { addSuffix: true })}</span>
                              )}
                              {note.web_url && (
                                <a
                                  href={note.web_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  view in attio →
                                </a>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <>
                              {note.attio_meeting_id && (
                                <div className="ai-section">
                                  <div className="ai-tags">
                                    <span className="ai-tag">
                                      linked to meeting
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="transcript-content">
                                <div className="transcript-paragraph">
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{note.content_plaintext}</p>
                                </div>
                              </div>

                              {note.content_markdown && note.content_markdown !== note.content_plaintext && (
                                <details className="raw-transcript">
                                  <summary>markdown content</summary>
                                  <pre>{note.content_markdown}</pre>
                                </details>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {browseCategory === 'lists' && (
                <>
                  {lists.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={48} strokeWidth={1.5} />
                      <p>no lists found. run sync to import data.</p>
                    </div>
                  ) : (
                    lists.map(list => (
                      <div key={list.id} className="meeting-card">
                        <div className="meeting-header">
                          <div className="meeting-icon">
                            <FileText size={20} strokeWidth={2} />
                          </div>
                          <div className="meeting-title-section">
                            <h3>{list.name}</h3>
                            <span className="transcript-indicator">
                              {list.entry_count} {list.entry_count === 1 ? 'entry' : 'entries'}
                            </span>
                          </div>
                        </div>

                        <div className="meeting-meta">
                          {list.parent_object && (
                            <div className="meta-item">
                              <Users size={14} />
                              <span>{list.parent_object}</span>
                            </div>
                          )}
                          {list.workspace_access && (
                            <div className="meta-item">
                              <span className="stage-badge">{list.workspace_access}</span>
                            </div>
                          )}
                        </div>

                        {list.list_created_at && (
                          <div className="meeting-meta">
                            <div className="meta-item">
                              <Calendar size={14} />
                              <span>created {formatDistanceToNow(new Date(list.list_created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="tab-content">
          <div className="candidates-header">
            <h2>candidate sourcing</h2>
            <p>ai-powered candidate search and analysis</p>
          </div>

          {/* Sub-tab navigation */}
          {/* search form and results */}
          <>
              {/* search submission */}
              <div className="candidate-search-section">
                <h3>new search</h3>
                <div className="search-input-row">
                  <input
                    type="text"
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && submitCandidateSearch()}
                    placeholder="e.g., find energy ml founders in the bay area"
                    className="candidate-search-input"
                  />
                  <button onClick={submitCandidateSearch} className="submit-search-button">
                    start search
                  </button>
                </div>
              </div>

              {/* search jobs status */}
              {searchJobs.length > 0 && (
                <div className="search-jobs-section">
                  <h3>search jobs ({searchJobs.length})</h3>
                  <div className="jobs-list">
                    {searchJobs.map(job => (
                      <div
                        key={job.job_id}
                        className={`job-card ${selectedJobId === job.job_id ? 'selected' : ''}`}
                        onClick={() => {
                          // stop polling old job when switching
                          if (searchPollIntervalRef.current) {
                            clearInterval(searchPollIntervalRef.current)
                            searchPollIntervalRef.current = null
                          }
                          setSelectedJobId(job.job_id)
                          fetchCandidates(job.job_id)
                          setSearchSuggestions([])
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="job-header">
                          <div className="job-title">
                            <h4>{job.query}</h4>
                            <span className={`job-status status-${job.status === 'cancelled' ? 'paused' : job.status}`}>
                              {job.status === 'cancelled' ? 'paused' : job.status}
                            </span>
                          </div>
                          <div className="job-stats">
                            <span>{job.candidate_count} candidates</span>
                            <div className="job-actions">
                              {job.status === 'running' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    cancelSearchJob(job.job_id)
                                  }}
                                  className="cancel-job-btn"
                                  title="pause search job"
                                >
                                  ⏸
                                </button>
                              )}
                              {job.status === 'paused' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    resumeSearchJob(job.job_id)
                                  }}
                                  className="resume-job-btn"
                                  title="resume search job"
                                >
                                  ▶
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSearchJob(job.job_id)
                                }}
                                className="delete-job-btn"
                                title="delete search job"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                        {job.status === 'running' && job.progress && (
                          <div className="job-progress">
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min((job.progress.candidates_found / 50) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <div className="progress-text">
                              iteration {job.progress.searches_completed || 0} - {job.progress.candidates_found} candidates found
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* candidates grid */}
              <div className="candidates-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>
                    candidates ({candidates.length})
                    {candidates.length > 0 && (() => {
                      const avgScore = candidates.reduce((sum, c) => sum + (c.ai_fit_score || (2.5 + (c.id % 20) / 10)), 0) / candidates.length
                      return (
                        <span className="selected-job-label inline-flex items-center gap-2">
                          {' '}• avg quality: <StarRating score={avgScore} size="sm" />
                        </span>
                      )
                    })()}
                    {selectedJobId && searchJobs.find(j => j.job_id === selectedJobId) && (
                      <span className="selected-job-label">
                        {' '}from "{searchJobs.find(j => j.job_id === selectedJobId)!.query}"
                      </span>
                    )}
                  </h3>
                  {/* filtering feature temporarily hidden - coming soon */}
                  {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={reapplyMemoryFilter}
                        disabled={reapplyingFilter || !selectedJobId || candidates.length === 0}
                        className="icon-button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          opacity: reapplyingFilter || !selectedJobId || candidates.length === 0 ? 0.5 : 1,
                          cursor: reapplyingFilter || !selectedJobId || candidates.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                        title="reapply memory filter to existing candidates (batch mode)"
                      >
                        <RefreshCw size={14} style={{ animation: reapplyingFilter ? 'spin 1s linear infinite' : 'none' }} />
                        {reapplyingFilter ? (filterProgress ? `filtering ${filterProgress.current}/${filterProgress.total}` : 'filtering...') : 'reapply filter'}
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        <Info size={14} />
                        <span>check memory to view filtered out examples</span>
                      </div>
                    </div>
                    {filterProgress && (
                      <div style={{ width: '300px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(filterProgress.current / filterProgress.total) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                  </div> */}
                </div>
                {candidatesLoading ? (
                  <div className="loading">loading candidates...</div>
                ) : candidates.length === 0 ? (
                  <div className="empty-state">
                    <div className="spinner"></div>
                    <p>no candidates yet</p>
                    <p className="hint">start a new search above to find candidates</p>
                  </div>
                ) : (
                  <div className="candidates-grid">
                    {candidates
                      .sort((a, b) => {
                        const scoreA = a.ai_fit_score || (2.5 + (a.id % 20) / 10)
                        const scoreB = b.ai_fit_score || (2.5 + (b.id % 20) / 10)
                        return scoreB - scoreA
                      })
                      .map(candidate => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onPass={async () => {
                          // remove candidate from list IMMEDIATELY (no buffering)
                          setCandidates(prev => prev.filter(c => c.id !== candidate.id))

                          // track pass in background (don't wait for it)
                          fetch(`${API_BASE}/api/outreach/track-pass`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              candidate_name: candidate.name,
                              candidate_linkedin_url: candidate.linkedin_url,
                              current_title: candidate.current_title,
                              current_company: candidate.current_company,
                              headline: candidate.headline,
                              search_id: selectedJobId
                            })
                          }).catch(err => {
                            console.error('error tracking pass:', err)
                          })
                        }}
                        onAddToPipeline={() => {
                          // not used anymore
                        }}
                        onReachOut={() => {
                          // remove candidate from list
                          setCandidates(prev => prev.filter(c => c.id !== candidate.id))
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* saved searches section - temporarily disabled, needs proper implementation */}
              {/* <div className="recurring-searches-section">
                <h3>saved searches ({RECURRING_SEARCHES.length})</h3>
                <div className="recurring-searches-list">
                  {RECURRING_SEARCHES.map(search => (
                    <div
                      key={search.id}
                      className="recurring-search-card"
                      onClick={() => {
                        setCandidateSearchQuery(search.query)
                        submitCandidateSearch()
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="recurring-header">
                        <div className="recurring-info">
                          <h4>{search.name}</h4>
                          <p className="recurring-description">{search.description}</p>
                        </div>
                      </div>
                      <div className="recurring-stats">
                        {search.location && <span>📍 {search.location}</span>}
                        {search.industry && <span>🏢 {search.industry}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </>

        </div>
      )}

      {/* memory */}
      {activeTab === 'memory' && (
        <div className="tab-content">
          <div className="content-header">
            <h1>memory</h1>
            <p className="subtitle">review learning data and auto-filtered profiles</p>
          </div>
          <Memory />
        </div>
      )}

      {/* settings view */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <Settings apiUrl={API_BASE} />
        </div>
      )}
      </div>
    </div>
  )
}

export default App
