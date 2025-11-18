import { useState } from 'react'
import { Home, Users, FileText, MessageSquare, Settings, Zap, ChevronLeft, Brain } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface AppSidebarProps {
  activeTab: 'dashboard' | 'candidates' | 'browse' | 'transcripts' | 'settings' | 'memory'
  onNavChange: (tab: 'dashboard' | 'candidates' | 'browse' | 'transcripts' | 'settings' | 'memory') => void
}

export default function AppSidebar({ activeTab, onNavChange }: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'candidates', label: 'Searches', icon: <Users size={20} /> },
    { id: 'browse', label: 'Browse', icon: <FileText size={20} /> },
    { id: 'transcripts', label: 'Transcripts', icon: <MessageSquare size={20} /> },
    { id: 'memory', label: 'Memory', icon: <Brain size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ]

  return (
    <div
      className={`bg-sidebar transition-all duration-300 border-r border-border flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="border-b border-border px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Entropy Capital</h2>
              <p className="text-xs text-muted-foreground">VC Co-Pilot</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-secondary rounded-md transition-colors"
          title={isCollapsed ? 'expand' : 'collapse'}
        >
          <ChevronLeft size={18} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <div className="text-xs text-muted-foreground font-semibold px-3 py-2">
          {!isCollapsed && 'Platform'}
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id as any)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer (optional) */}
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        {!isCollapsed && <p className="truncate">v1.0</p>}
      </div>
    </div>
  )
}
