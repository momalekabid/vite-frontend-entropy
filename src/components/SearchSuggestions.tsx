import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { API_BASE } from '@/config'

interface Suggestion {
  id: string
  text: string
  category: 'keyword' | 'industry' | 'geography'
  action?: () => void
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[]
  candidateCount?: number
  onSearch?: (suggestion: Suggestion) => void
}

export default function SearchSuggestions({ suggestions, candidateCount = 0, onSearch }: SearchSuggestionsProps) {
  const [thesisSuggestions, setThesisSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  // fetch thesis-based suggestions on mount
  useEffect(() => {
    const fetchThesisSuggestions = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/search-suggestions`)
        const data = await response.json()
        if (data.success && data.suggestions) {
          setThesisSuggestions(data.suggestions)
        }
      } catch (err) {
        console.error('error fetching thesis suggestions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchThesisSuggestions()
  }, [])

  const displaySuggestions = suggestions.length > 0 ? suggestions : thesisSuggestions

  const groupedSuggestions = displaySuggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = []
      }
      acc[suggestion.category].push(suggestion)
      return acc
    },
    {} as Record<string, Suggestion[]>
  )

  const categoryLabels = {
    keyword: '🔍 refine keywords',
    industry: '🏭 industry expansions',
    geography: '📍 geographic suggestions'
  }

  const isDefault = suggestions.length === 0

  if (loading && displaySuggestions.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-medium text-foreground mb-6">
          intelligent search suggestions
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          generating suggestions based on your fund thesis...
        </p>
      </div>
    )
  }

  if (displaySuggestions.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-medium text-foreground mb-6">
          intelligent search suggestions
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          configure your fund thesis in settings to get personalized suggestions
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h2 className="text-lg font-medium text-foreground mb-6">
        {isDefault ? 'intelligent search suggestions' : 'search suggestions'}
      </h2>

      <p className="text-xs text-muted-foreground mb-6">
        {isDefault
          ? 'ai-powered suggestions based on your fund thesis and past calls'
          : `based on ${candidateCount} high-fit ${candidateCount === 1 ? 'candidate' : 'candidates'} from last search`
        }
      </p>

      <div className="space-y-6">
        {Object.entries(groupedSuggestions).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs text-muted-foreground font-semibold mb-3">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <div className="space-y-2">
              {items.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-sm text-foreground">{suggestion.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearch?.(suggestion)}
                    className="text-primary text-xs hover:bg-primary/10"
                  >
                    [search]
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
