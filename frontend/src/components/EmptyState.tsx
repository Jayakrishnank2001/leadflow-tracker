import { Search } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  hint?: string
}

export function EmptyState({ title = 'No leads found', hint = 'Try adjusting your search or filters.' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Search size={22} />
      <strong>{title}</strong>
      <span>{hint}</span>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="loading-state" aria-label="Loading leads">
      <div className="spinner" />
      <span>Loading leads...</span>
    </div>
  )
}
