interface StarRatingProps {
  score: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ score, maxStars = 5, size = 'md' }: StarRatingProps) {
  const sizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]

  const filledStars = Math.floor(score)

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, i) => (
        <span
          key={i}
          className={`${sizeClass} ${
            i < filledStars ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
