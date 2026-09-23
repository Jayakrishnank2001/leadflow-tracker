import { useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState } from '@/components/EmptyState'
import { LeadForm } from '@/components/LeadForm'
import { LeadTable } from '@/components/LeadTable'
import { Pagination } from '@/components/Pagination'
import { SearchBar } from '@/components/SearchBar'
import { StatsCards } from '@/components/StatsCards'
import { StatusFilter } from '@/components/StatusFilter'
import type { CreateLeadInput, Lead, LeadStatus, StatusFilter as StatusFilterValue } from '@/types/lead'

export interface LeadsPageProps {
  leads?: Lead[]
  isLoading?: boolean
  onCreateLead?: (lead: CreateLeadInput) => void
  onUpdateStatus?: (leadId: Lead['id'], status: LeadStatus) => void
  onDeleteLead?: (leadId: Lead['id']) => void
  onSearch?: (query: string) => void
}

const PAGE_SIZE = 5

export function LeadsPage({
  leads: externalLeads = [],
  isLoading = false,
  onCreateLead,
  onUpdateStatus,
  onDeleteLead,
  onSearch,
}: LeadsPageProps) {
  const [leads, setLeads] = useState<Lead[]>(externalLeads)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilterValue>('All statuses')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<Lead['id'] | null>(null)
  const [page, setPage] = useState(1)

  // Sync state when parent (later: backend fetch) provides leads.
  useEffect(() => {
    setLeads(externalLeads)
  }, [externalLeads])

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          `${lead.name} ${lead.email} ${lead.phone}`.toLowerCase().includes(query.toLowerCase()) &&
          (filter === 'All statuses' || lead.status === filter),
      ),
    [leads, query, filter],
  )

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearch = (value: string) => {
    setQuery(value)
    setPage(1)
    onSearch?.(value)
  }

  const handleFilterChange = (value: StatusFilterValue) => {
    setFilter(value)
    setPage(1)
  }

  const handleCreate = (input: CreateLeadInput) => {
    onCreateLead?.(input)
    setIsDialogOpen(false)
  }

  const handleDelete = (id: Lead['id']) => {
    onDeleteLead?.(id)
    setOpenMenu(null)
    setPage(1)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Sparkles size={18} />
          </div>
          <span>Leadflow</span>
        </div>
        <div className="workspace-label">Workspace</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          <a className="nav-item active" href="#leads">
            <Users size={17} /> Leads <span className="nav-count">{leads.length}</span>
          </a>
        </nav>
      </aside>
      <section className="content-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>Leads</strong>
          </div>
          <div className="top-actions" />
        </header>
        <div className="content-inner" id="leads">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Workspace overview</p>
              <h1 className="page-title">Turn every lead into momentum.</h1>
              <p className="subtitle">Keep your pipeline clear, focused, and moving forward.</p>
            </div>
            <Button className="create-button" onClick={() => setIsDialogOpen(true)}>
              <Plus size={17} /> Create lead
            </Button>
          </div>
          <StatsCards leads={leads} activeFilter={filter} onSelectStatus={handleFilterChange} />
          <div className="leads-card">
            <div className="card-heading">
              <div>
                <h2>All leads</h2>
                <p>Manage and track your prospects in one place.</p>
              </div>
            </div>
            <div className="toolbar">
              <SearchBar value={query} onChange={handleSearch} />
              <StatusFilter value={filter} onChange={handleFilterChange} />
            </div>
            <div className="table-wrap">
              {isLoading ? (
                <LoadingState />
              ) : visibleLeads.length === 0 ? (
                <EmptyState />
              ) : (
                <LeadTable
                  leads={visibleLeads}
                  openMenuId={openMenu}
                  onToggleMenu={setOpenMenu}
                  onUpdateStatus={(id, status) => onUpdateStatus?.(id, status)}
                  onDeleteLead={handleDelete}
                />
              )}
            </div>
            <div className="table-footer">
              <span>
                Showing{' '}
                {visibleLeads.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
                {Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length}{' '}
                leads
              </span>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        </div>
      </section>
      <LeadForm open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleCreate} />
    </main>
  )
}
