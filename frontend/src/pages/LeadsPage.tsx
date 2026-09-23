import { useCallback, useEffect, useState } from 'react'
import { Plus, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState } from '@/components/EmptyState'
import { LeadForm } from '@/components/LeadForm'
import { LeadTable } from '@/components/LeadTable'
import { Pagination } from '@/components/Pagination'
import { SearchBar } from '@/components/SearchBar'
import { StatsCards } from '@/components/StatsCards'
import { StatusFilter } from '@/components/StatusFilter'
import { leadService } from '@/services/lead.service'
import type { CreateLeadInput, Lead, LeadStatus, StatusFilter as StatusFilterValue } from '@/types/lead'

export interface LeadsPageProps {
  pageSize?: number
}

export function LeadsPage({ pageSize = 5 }: LeadsPageProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilterValue>('All statuses')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<Lead['id'] | null>(null)
  const [page, setPage] = useState(1)
  const [statsLeads, setStatsLeads] = useState<Lead[]>([])
  // Bump to refetch stats after mutations without coupling to table pagination.
  const [statsVersion, setStatsVersion] = useState(0)

  const fetchLeads = useCallback(
    async (searchTerm: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await leadService.list({
          search: searchTerm.trim() || undefined,
          status: filter,
          page,
          limit: pageSize,
        })
        setLeads(result.data)
        setTotal(result.pagination.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads')
        setLeads([])
        setTotal(0)
      } finally {
        setIsLoading(false)
      }
    },
    [filter, page, pageSize],
  )

  // Debounce: wait for a pause in typing before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search, fetchLeads])

  // Stats cards need global counts, not the paginated/filtered slice.
  useEffect(() => {
    let cancelled = false
    leadService
      .list({ limit: 100 })
      .then((result) => {
        if (!cancelled) setStatsLeads(result.data)
      })
      .catch(() => {
        if (!cancelled) setStatsLeads([])
      })
    return () => {
      cancelled = true
    }
  }, [statsVersion])

  const refreshStats = useCallback(() => setStatsVersion((v) => v + 1), [])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (value: StatusFilterValue) => {
    setFilter(value)
    setPage(1)
  }

  const handleCreate = async (input: CreateLeadInput) => {
    await leadService.create(input)
    setIsDialogOpen(false)
    setPage(1)
    await fetchLeads('')
    refreshStats()
  }

  const handleUpdateStatus = async (id: Lead['id'], status: LeadStatus) => {
    try {
      await leadService.updateStatus(id, status)
      await fetchLeads(search)
      refreshStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleDelete = async (id: Lead['id']) => {
    try {
      await leadService.remove(id)
      setOpenMenu(null)
      // If we deleted the last row on a later page, step back so we don't
      // land on an empty page.
      if (leads.length === 1 && page > 1) setPage(page - 1)
      else await fetchLeads(search)
      refreshStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead')
    }
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
            <Users size={17} /> Leads <span className="nav-count">{statsLeads.length || total}</span>
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
          <StatsCards leads={statsLeads} activeFilter={filter} onSelectStatus={handleFilterChange} />
          <div className="leads-card">
            <div className="card-heading">
              <div>
                <h2>All leads</h2>
                <p>Manage and track your prospects in one place.</p>
              </div>
            </div>
            <div className="toolbar">
              <SearchBar value={search} onChange={handleSearch} />
              <StatusFilter value={filter} onChange={handleFilterChange} />
            </div>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <div className="table-wrap">
              {isLoading ? (
                <LoadingState />
              ) : leads.length === 0 ? (
                <EmptyState />
              ) : (
                <LeadTable
                  leads={leads}
                  openMenuId={openMenu}
                  onToggleMenu={setOpenMenu}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteLead={handleDelete}
                />
              )}
            </div>
            <div className="table-footer">
              <span>
                Showing {leads.length ? (page - 1) * pageSize + 1 : 0}-
                {Math.min(page * pageSize, total)} of {total} leads
              </span>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>
        </div>
      </section>
      <LeadForm open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleCreate} />
    </main>
  )
}
