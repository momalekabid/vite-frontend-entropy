interface DashboardCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
}

export default function DashboardCard({ title, value, icon, description }: DashboardCardProps) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="text-primary opacity-50">
          {icon}
        </div>
      </div>
    </div>
  )
}
