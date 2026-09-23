export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted'

export interface Lead {
  _id: string
  name: string
  email: string
  phone: string
  status: LeadStatus
  createdAt: string
  updatedAt: string
  initials?: string
  color?: string
  /** Client-side alias for `_id` (Mongo). Populated by the service layer. */
  id: string
}

export type StatusFilter = 'All statuses' | LeadStatus

export interface CreateLeadInput {
  name: string
  email: string
  phone: string
  status: LeadStatus
}

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted']
