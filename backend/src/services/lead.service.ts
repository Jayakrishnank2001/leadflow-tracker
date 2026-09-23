import Lead, { type LeadDocument, type LeadStatus } from '../models/lead.model.js'
import type { CreateLeadInput, ListLeadsQuery } from '../validators/lead.validator.js'
import { HttpError } from '../validators/lead.validator.js'

export interface PaginatedLeads {
  data: LeadDocument[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function createLead(input: CreateLeadInput): Promise<LeadDocument> {
  const lead = new Lead(input)
  return lead.save()
}

export async function listLeads(query: ListLeadsQuery): Promise<PaginatedLeads> {
  const { search, status, page, limit } = query

  const filter: Record<string, unknown> = {}
  if (status) {
    filter.status = status
  }
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }]
  }

  const [data, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(filter),
  ])

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<LeadDocument> {
  const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })

  if (!lead) {
    throw new HttpError(404, 'Lead not found')
  }

  return lead
}
