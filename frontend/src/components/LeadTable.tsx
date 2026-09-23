import { useEffect, useRef } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { LeadStatusSelect } from '@/components/LeadStatusSelect'
import type { Lead, LeadStatus } from '@/types/lead'

interface LeadTableProps {
  leads: Lead[]
  openMenuId: Lead['id'] | null
  onToggleMenu: (id: Lead['id'] | null) => void
  onUpdateStatus: (id: Lead['id'], status: LeadStatus) => void
  onDeleteLead: (id: Lead['id']) => void
}

export function LeadTable({ leads, openMenuId, onToggleMenu, onUpdateStatus, onDeleteLead }: LeadTableProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the delete menu on outside click / Escape. Status selects handle
  // their own outside-click, so no cross-component signal is needed.
  useEffect(() => {
    if (openMenuId === null) return

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggleMenu(null)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleMenu(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId, onToggleMenu])

  return (
    <table>
      <thead>
        <tr>
          <th>LEAD</th>
          <th>CONTACT</th>
          <th>STATUS</th>
          <th>CREATED</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id}>
            <td>
              <div className="lead-cell">
                <div className={`lead-avatar ${lead.color ?? 'bg-slate-100 text-slate-700'}`}>
                  {lead.initials ?? lead.name.slice(0, 2).toUpperCase()}
                </div>
                <strong>{lead.name}</strong>
              </div>
            </td>
            <td>
              <div className="contact-cell">
                <span>{lead.email}</span>
                <span>{lead.phone}</span>
              </div>
            </td>
            <td>
              <LeadStatusSelect status={lead.status} onChange={(status) => onUpdateStatus(lead.id, status)} />
            </td>
            <td className="created-cell">{lead.createdAt}</td>
            <td className="menu-cell">
              <div className="lead-menu-wrap" ref={openMenuId === lead.id ? menuRef : undefined}>
                <button
                  className="row-menu"
                  aria-label={`Actions for ${lead.name}`}
                  aria-expanded={openMenuId === lead.id}
                  onClick={() => onToggleMenu(openMenuId === lead.id ? null : lead.id)}
                >
                  <MoreHorizontal size={18} />
                </button>
                {openMenuId === lead.id && (
                  <div className="lead-menu">
                    <button onClick={() => onDeleteLead(lead.id)}>
                      <Trash2 size={14} /> Delete lead
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
