import dbClient from '../../utils/dbClient.js'
import { InternalServerError, NoAccessError, NotFoundError } from '../../utils/Errors.js'
import { sendDataResponse, sendMessageResponse } from '../../utils/serverResponse.js'
import {
  createEventInDB,
  createInvitationInDB,
  findEventInDB,
  findInvitationInDB,
  findParticipantInDB,
  updateEventInDB,
  updateVoteInDB,
} from './utils.js'
import 'dotenv/config'

const serverError = new InternalServerError()

export async function getAllEvents(req, res) {
  const { id, email } = req.user

  try {
    const events = await dbClient.event.findMany({
      where: {
        OR: [{ hostId: id }, { participants: { some: { email: email } } }],
      },
      orderBy: { createdAt: 'desc' },
      include: { slots: true },
    })

    sendDataResponse(res, 200, events)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function getEventById(req, res) {
  const id = req.params.id

  try {
    const foundEvent = await findEventInDB(id)

    if (!foundEvent) {
      const notFound = new NotFoundError('event', 'id')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (foundEvent.hostId !== req.user.id) {
      const noAccess = new NoAccessError()
      return sendMessageResponse(res, noAccess.code, noAccess.message)
    }

    sendDataResponse(res, 200, foundEvent)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function getEventByCode(req, res) {
  const { code } = req.params

  try {
    const foundInvitation = await findInvitationInDB(code)

    if (!foundInvitation) {
      return sendMessageResponse(
        res,
        404,
        'Event does not exist or has been closed by the organizer.'
      )
    }

    let expired = false
    if (foundInvitation.expiresAt < Date.now()) {
      expired = true
    }

    const event = await findEventInDB(foundInvitation.eventId)

    sendDataResponse(res, 200, { event, expired })
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function createEvent(req, res) {
  try {
    const event = await createEventInDB(req.body, req.user.id, res)

    const invitation = await createInvitationInDB(event.id, req.body.deadline)
    console.log('invitation created: ', invitation)
    const clientUrl = process.env.CLIENT_URL
    const link = clientUrl + '/events/participate/' + invitation.id

    sendDataResponse(res, 201, { event, link, code: invitation.id })
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function updateEventById(req, res) {
  const { id } = req.params

  try {
    const foundEvent = await findEventInDB(id)

    if (!foundEvent) {
      const notFound = new NotFoundError('event', 'id')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (foundEvent.hostId !== req.user.id) {
      const noAccess = new NoAccessError()
      return sendMessageResponse(res, noAccess.code, noAccess.message)
    }

    const updated = await updateEventInDB(foundEvent.id, req.body)
    sendDataResponse(res, 201, updated)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function deleteEventById(req, res) {
  const { id } = req.params

  try {
    const foundEvent = await findEventInDB(id)

    if (!foundEvent) {
      const notFound = new NotFoundError('event', 'id')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }

    if (foundEvent.hostId !== req.user.id) {
      const noAccess = new NoAccessError()
      return sendMessageResponse(res, noAccess.code, noAccess.message)
    }

    await dbClient.event.delete({ where: { id: foundEvent.id } })
    sendMessageResponse(res, 201, 'Event deleted')
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function createParticipantForEvent(req, res) {
  const { code, email } = req.params

  try {
    const foundInvitation = await findInvitationInDB(code)

    if (!foundInvitation) {
      return sendMessageResponse(
        res,
        404,
        'Event does not exist or has been closed by the organizer.'
      )
    }

    if (foundInvitation.expiresAt < Date.now()) {
      return sendMessageResponse(res, 401, 'This invitation has expired.')
    }

    const eventId = foundInvitation.eventId
    const participant = await dbClient.participant.upsert({
      where: {
        email_eventId: {
          eventId,
          email,
        },
      },
      update: { name: req.body.name },
      create: {
        email,
        eventId,
        name: req.body.name,
      },
      include: { votedSlots: true },
    })
    sendDataResponse(res, 201, participant)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}

export async function createParticipantVotes(req, res) {
  const { code, email } = req.params

  try {
    const foundInvitation = await findInvitationInDB(code)

    if (!foundInvitation) {
      return sendMessageResponse(
        res,
        404,
        'Event does not exist or has been closed by the organizer.'
      )
    }

    if (foundInvitation.expiresAt < Date.now()) {
      return sendMessageResponse(res, 401, 'This invitation has expired.')
    }

    const eventId = foundInvitation.eventId
    const foundParticipant = await findParticipantInDB(eventId, email)

    if (!foundParticipant) {
      const notFound = new NotFoundError('Participant', 'email')
      return sendMessageResponse(res, notFound.code, notFound.message)
    }
    console.log('foundParticipant: ', foundParticipant)

    const voted = await updateVoteInDB(eventId, email, req.body.votedSlots)
    return sendDataResponse(res, 201, voted)
  } catch (err) {
    sendMessageResponse(res, serverError.code, serverError.message)
    throw err
  }
}
