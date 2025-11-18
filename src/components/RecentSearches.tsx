import { Button } from '@/components/ui/button'
import StarRating from './StarRating'

export interface SearchResult {
  job_id: string
  query: string
  status: string
  candidate_count: number
  avg_ai_score?: number
  reach_out_count?: number
  research_count?: number
  pass_count?: number
  created_at?: string
}

interface RecentSearchesProps {
  searches: SearchResult[]
  onNewSearch?: () => void
  onSearchClick?: (jobId: string) => void
}

export default function RecentSearches({ searches, onNewSearch, onSearchClick }: RecentSearchesProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'recently'
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'today'
    if (date.toDateString() === yesterday.toDateString()) return 'yesterday'

    return date.toLocaleDateString('en-us', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">autonomous sourcing</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewSearch}
          className="text-xs"
        >
          [new search]
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs text-muted-foreground font-semibold">recent searches</h3>

        {searches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            no searches yet. start a new search to see results here.
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map(search => (
              <div
                key={search.job_id}
                className="border border-border rounded-lg p-4 space-y-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => onSearchClick?.(search.job_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="font-mono text-sm text-foreground">{search.query}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(search.created_at)}</span>
                      <span>•</span>
                      <span>{search.candidate_count} results</span>
                    </div>
                    {search.avg_ai_score && (
                      <div className="flex items-center gap-2">
                        <StarRating score={search.avg_ai_score} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {search.avg_ai_score.toFixed(1)} avg ai score
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    search.status === 'running'
                      ? 'bg-primary/20 text-primary'
                      : search.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : search.status === 'paused' || search.status === 'cancelled'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {search.status === 'cancelled' ? 'paused' : search.status}
                  </span>
                </div>

                {(search.reach_out_count || search.research_count || search.pass_count) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {search.reach_out_count !== undefined && (
                      <>
                        <span>{search.reach_out_count} reach out</span>
                        <span>•</span>
                      </>
                    )}
                    {search.research_count !== undefined && (
                      <>
                        <span>{search.research_count} research</span>
                        <span>•</span>
                      </>
                    )}
                    {search.pass_count !== undefined && (
                      <span>{search.pass_count} pass</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
