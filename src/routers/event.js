import { Router } from 'express'
import {
  createEvent,
  createParticipantForEvent,
  deleteEventById,
  getAllEvents,
  getEventByCode,
  getEventById,
  updateEventById,
  createParticipantVotes,
} from '../controllers/event/event.js'
import { validateAuthentication } from '../middleware/auth.js'

const router = Router()

router.get('/', validateAuthentication, getAllEvents)
router.get('/:id', validateAuthentication, getEventById)
router.get('/participate/:code', getEventByCode)

router.post('/', validateAuthentication, createEvent)
router.post('/participate/:code/:email', createParticipantForEvent)

router.patch('/:id', validateAuthentication, updateEventById)
router.patch('/participate/:code/:email', createParticipantVotes)

router.delete('/:id', validateAuthentication, deleteEventById)

export default router
