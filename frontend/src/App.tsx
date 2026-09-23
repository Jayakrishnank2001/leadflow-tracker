
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, MoreHorizontal, Plus, Search, Sparkles, Users, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = 'New' | 'Contacted' | 'Qualified' | 'Converted'
export type Lead = { id: string | number; name: string; email: string; phone: string; status: Status; createdAt: string; initials?: string; color?: string }
type LeadTrackerProps = { leads?: Lead[]; isLoading?: boolean; onCreateLead?: (lead: Omit<Lead, 'id' | 'createdAt'>) => void; onUpdateStatus?: (leadId: Lead['id'], status: Status) => void; onDeleteLead?: (leadId: Lead['id']) => void; onSearch?: (query: string) => void }

const statuses: Status[] = ['New', 'Contacted', 'Qualified', 'Converted']
const statusStyles: Record<Status, string> = { New: 'bg-sky-50 text-sky-700 ring-sky-200', Contacted: 'bg-amber-50 text-amber-700 ring-amber-200', Qualified: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Converted: 'bg-teal-50 text-teal-700 ring-teal-200' }

function CustomSelect({ value, options, onChange, ariaLabel, tone = 'neutral' }: { value: string; options: string[]; onChange: (value: string) => void; ariaLabel: string; tone?: string }) { const [open, setOpen] = useState(false); return <div className={`custom-select ${tone} ${open ? 'is-open' : ''}`}><button type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((current) => !current)}><span>{value}</span><ChevronDown size={16} aria-hidden="true" /></button>{open && <div className="select-menu" role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option === value} className={option === value ? 'selected' : ''} key={option} onClick={() => { onChange(option); setOpen(false) }}>{option === value && <span className="option-check">✓</span>}<span>{option}</span></button>)}</div>}</div> }

function StatusSelect({ status, onChange }: { status: Status; onChange: (status: Status) => void }) { return <CustomSelect value={status} options={statuses} onChange={(value) => onChange(value as Status)} ariaLabel={`Change status from ${status}`} tone={`status-select ${statusStyles[status]}`} /> }


export default function App() { return <LeadTracker /> }

export function LeadTracker({ leads: externalLeads = [], isLoading = false, onCreateLead, onUpdateStatus, onDeleteLead, onSearch }: LeadTrackerProps) {
  const [leads, setLeads] = useState<Lead[]>(externalLeads)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'All statuses' | Status>('All statuses')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<Lead['id'] | null>(null)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'New' as Status })
  // Sync state when parent (later: backend fetch) provides leads.
  useEffect(() => {
    setLeads(externalLeads)
  }, [externalLeads])
  const pageSize = 5
  const filteredLeads = useMemo(() => leads.filter((lead) => `${lead.name} ${lead.email} ${lead.phone}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All statuses' || lead.status === filter)), [leads, query, filter])
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const counts = statuses.reduce((result, status) => ({ ...result, [status]: leads.filter((lead) => lead.status === status).length }), {} as Record<Status, number>)
  const updateStatus = (id: Lead['id'], status: Status) => { onUpdateStatus?.(id, status) }
  const deleteLead = (id: Lead['id']) => { onDeleteLead?.(id); setOpenMenu(null); setPage(1) }
  const createLead = (event: React.FormEvent) => {
    event.preventDefault()
    onCreateLead?.({ ...form })
    setForm({ name: '', email: '', phone: '', status: 'New' })
    setIsDialogOpen(false)
  }
  const handleSearch = (value: string) => { setQuery(value); setPage(1); onSearch?.(value) }
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark" aria-hidden="true"><Sparkles size={18} /></div><span>Leadflow</span></div><div className="workspace-label">Workspace</div><nav className="side-nav" aria-label="Workspace navigation"><a className="nav-item active" href="#leads"><Users size={17} /> Leads <span className="nav-count">{leads.length}</span></a></nav></aside>
    <section className="content-area"><header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Leads</strong></div><div className="top-actions" /></header><div className="content-inner" id="leads"><div className="page-heading"><div><p className="eyebrow">Workspace overview</p><h1 className="page-title">Turn every lead into momentum.</h1><p className="subtitle">Keep your pipeline clear, focused, and moving forward.</p></div><Button className="create-button" onClick={() => setIsDialogOpen(true)}><Plus size={17} /> Create lead</Button></div>
      <div className="stats-grid"><div className="stat-card"><div className="stat-icon blue"><Users size={18} /></div><span>Total leads</span><strong>{leads.length}</strong></div>{statuses.map((status) => <button key={status} className={`stat-card status-card ${filter === status ? 'selected' : ''}`} onClick={() => { setFilter(status); setPage(1) }}><div className={`stat-icon ${status.toLowerCase()}`} aria-hidden="true">{status === 'New' ? <Sparkles size={17} /> : status === 'Contacted' ? <Search size={17} /> : status === 'Qualified' ? <Users size={17} /> : <Plus size={17} />}</div><span>{status}</span><strong>{counts[status]}</strong></button>)}</div>
      <div className="leads-card"><div className="card-heading"><div><h2>All leads</h2><p>Manage and track your prospects in one place.</p></div></div><div className="toolbar"><div className="search-wrap"><Search size={17} /><input aria-label="Search leads" placeholder="Search by name, email, or phone..." value={query} onChange={(event) => handleSearch(event.target.value)} /></div><CustomSelect value={filter} options={['All statuses', ...statuses]} onChange={(value) => { setFilter(value as 'All statuses' | Status); setPage(1) }} ariaLabel="Filter leads by status" /></div><div className="table-wrap">{isLoading ? <div className="loading-state" aria-label="Loading leads"><div className="spinner" /><span>Loading leads...</span></div> : visibleLeads.length === 0 ? <div className="empty-state"><Search size={22} /><strong>No leads found</strong><span>Try adjusting your search or filters.</span></div> : <table><thead><tr><th>LEAD</th><th>CONTACT</th><th>STATUS</th><th>CREATED</th><th /></tr></thead><tbody>{visibleLeads.map((lead) => <tr key={lead.id}><td><div className="lead-cell"><div className={`lead-avatar ${lead.color ?? 'bg-slate-100 text-slate-700'}`}>{lead.initials ?? lead.name.slice(0, 2).toUpperCase()}</div><strong>{lead.name}</strong></div></td><td><div className="contact-cell"><span>{lead.email}</span><span>{lead.phone}</span></div></td><td><StatusSelect status={lead.status} onChange={(status) => updateStatus(lead.id, status)} /></td><td className="created-cell">{lead.createdAt}</td><td className="menu-cell"><div className="lead-menu-wrap"><button className="row-menu" aria-label={`Actions for ${lead.name}`} onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}><MoreHorizontal size={18} /></button>{openMenu === lead.id && <div className="lead-menu"><button onClick={() => deleteLead(lead.id)}><Trash2 size={14} /> Delete lead</button></div>}</div></td></tr>)}</tbody></table>}</div><div className="table-footer"><span>Showing {visibleLeads.length ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads</span><div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page">Previous</button>{Array.from({ length: pageCount }, (_, index) => <button key={index + 1} className={currentPage === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button disabled={currentPage === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next page">Next</button></div></div></div></div></section>
    {isDialogOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsDialogOpen(false) }}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-header"><div><h2 id="dialog-title">Create a new lead</h2><p>Add a prospect to your pipeline.</p></div><button className="icon-button" onClick={() => setIsDialogOpen(false)} aria-label="Close dialog"><X size={18} /></button></div><form onSubmit={createLead}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Alex Morgan" /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="alex@company.com" /></label><label>Phone<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+1 (555) 000-0000" /></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></label><div className="dialog-actions"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button type="submit" className="create-button">Create lead</Button></div></form></div></div>}
  </main>
}
