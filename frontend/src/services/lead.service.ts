import { api } from '@/lib/api'
import type { CreateLeadInput, Lead, LeadStatus } from '@/types/lead'

export interface PaginatedLeads {
  data: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ListLeadsParams {
  search?: string
  status?: LeadStatus | 'All statuses'
  page?: number
  limit?: number
}

// NOTE: Not wired to any component yet — used in the next step when we
// connect the UI to the backend APIs.
export const leadService = {
  list(params: ListLeadsParams = {}): Promise<PaginatedLeads> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.status && params.status !== 'All statuses') searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    return api.get<PaginatedLeads>(`/api/leads${query ? `?${query}` : ''}`)
  },

  create(input: CreateLeadInput): Promise<Lead> {
    return api.post<Lead>('/api/leads', input)
  },

  updateStatus(id: Lead['id'], status: LeadStatus): Promise<Lead> {
    return api.patch<Lead>(`/api/leads/${id}/status`, { status })
  },
}
