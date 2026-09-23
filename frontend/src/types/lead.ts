export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted'

export interface Lead {
  id: string | number
  name: string
  email: string
  phone: string
  status: LeadStatus
  createdAt: string
  initials?: string
  color?: string
}

export type StatusFilter = 'All statuses' | LeadStatus

export interface CreateLeadInput {
  name: string
  email: string
  phone: string
  status: LeadStatus
}

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted']
