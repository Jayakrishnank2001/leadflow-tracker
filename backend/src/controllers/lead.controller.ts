import type { NextFunction, Request, Response } from 'express'
import * as leadService from '../services/lead.service.js'
import {
  validateCreateLead,
  validateListQuery,
  validateStatusUpdate,
} from '../validators/lead.validator.js'

export async function createLeadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateCreateLead(req.body)
    const lead = await leadService.createLead(input)
    res.status(201).json(lead)
  } catch (error) {
    next(error)
  }
}

export async function listLeadsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = validateListQuery(req.query)
    const result = await leadService.listLeads(query)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateLeadStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status } = validateStatusUpdate(req.body)
    const lead = await leadService.updateLeadStatus(req.params.id, status)
    res.json(lead)
  } catch (error) {
    next(error)
  }
}

export async function deleteLeadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await leadService.deleteLead(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
