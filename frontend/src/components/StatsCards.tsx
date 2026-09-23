import { Plus, Search, Sparkles, Users } from 'lucide-react'
import { LEAD_STATUSES, type Lead, type LeadStatus, type StatusFilter } from '@/types/lead'

interface StatsCardsProps {
  leads: Lead[]
  activeFilter: StatusFilter
  onSelectStatus: (status: StatusFilter) => void
}

export function StatsCards({ leads, activeFilter, onSelectStatus }: StatsCardsProps) {
  const counts = LEAD_STATUSES.reduce(
    (result, status) => ({
      ...result,
      [status]: leads.filter((lead) => lead.status === status).length,
    }),
    {} as Record<LeadStatus, number>,
  )

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon blue">
          <Users size={18} />
        </div>
        <span>Total leads</span>
        <strong>{leads.length}</strong>
      </div>
      {LEAD_STATUSES.map((status) => (
        <button
          key={status}
          className={`stat-card status-card ${activeFilter === status ? 'selected' : ''}`}
          onClick={() => onSelectStatus(status)}
        >
          <div className={`stat-icon ${status.toLowerCase()}`} aria-hidden="true">
            {status === 'New' ? (
              <Sparkles size={17} />
            ) : status === 'Contacted' ? (
              <Search size={17} />
            ) : status === 'Qualified' ? (
              <Users size={17} />
            ) : (
              <Plus size={17} />
            )}
          </div>
          <span>{status}</span>
          <strong>{counts[status]}</strong>
        </button>
      ))}
    </div>
  )
}
