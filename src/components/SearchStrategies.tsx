/**
 * display the search strategies being executed for a search job
 * shows keywords and filter details for each strategy iteration
 */

interface SearchStrategy {
  keywords: string
  location?: string
  tenure?: number
  past_company?: string[]
  seniority?: string[]
}

interface SearchStrategiesProps {
  strategies: SearchStrategy[]
  iteration?: number
  isRunning?: boolean
  onStrategyInfo?: (strategy: SearchStrategy) => void
}

export default function SearchStrategies({
  strategies,
  iteration = 1,
  isRunning = false,
  onStrategyInfo
}: SearchStrategiesProps) {
  if (strategies.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-medium text-foreground mb-4">search strategies</h2>
        <p className="text-xs text-muted-foreground">
          no strategies generated yet
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">search strategies</h2>
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">iteration {iteration}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {strategies.map((strategy, idx) => (
          <div
            key={idx}
            className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
            onClick={() => onStrategyInfo?.(strategy)}
          >
            {/* keywords */}
            <div className="mb-3">
              <span className="text-sm font-semibold text-primary">
                keywords:
              </span>
              <span className="ml-2 text-sm text-foreground">
                {strategy.keywords}
              </span>
            </div>

            {/* filters - only show if present */}
            <div className="space-y-2">
              {strategy.location && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">📍 location:</span>
                  <span className="ml-2">{strategy.location}</span>
                </div>
              )}

              {strategy.tenure && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">⏳ experience:</span>
                  <span className="ml-2">{strategy.tenure}+ years</span>
                </div>
              )}

              {strategy.past_company && strategy.past_company.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">🏢 alumni from:</span>
                  <span className="ml-2">
                    {strategy.past_company.join(', ')}
                  </span>
                </div>
              )}

              {strategy.seniority && strategy.seniority.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">📊 seniority:</span>
                  <span className="ml-2">
                    {strategy.seniority.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        💡 the system generates multiple search strategies each iteration, combining
        keywords with filters to find the right people
      </p>
    </div>
  )
}
