import { Router } from 'express'
import {
  createLeadHandler,
  listLeadsHandler,
  updateLeadStatusHandler,
} from '../controllers/lead.controller.js'

const router = Router()

router.post('/', createLeadHandler)
router.get('/', listLeadsHandler)
router.patch('/:id/status', updateLeadStatusHandler)

export default router
