import { Router } from 'express'
import {
  createLeadHandler,
  deleteLeadHandler,
  listLeadsHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js'

const router = Router()

router.post('/', createLeadHandler)
router.get('/', listLeadsHandler)
router.patch('/:id/status', updateLeadStatusHandler)
router.delete('/:id', deleteLeadHandler)

export default router
