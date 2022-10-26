import dbClient from '../../utils/dbClient.js'
import { BadRequestError, MissingInputError } from '../../utils/Errors.js'
import { sendMessageResponse } from '../../utils/serverResponse.js'

export async function findEventInDB(id) {
  try {
    const foundEvent = await dbClient.event.findUnique({
      where: { id },
      include: {
        slots: {
          include: {
            participants: { include: { votedSlots: true } },
          },
        },
        invitation: true,
        host: true,
      },
    })
    return foundEvent
  } catch (err) {
    throw err
  }
}

export async function createEventInDB(data, hostId, res) {
  const { title, description, posterUrl, slots } = data
  console.log('slots: ', slots)

  if (!title) {
    const err = new BadRequestError('An event must have a title')
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    const event = await dbClient.event.create({
      data: {
        title,
        description,
        posterUrl,
        hostId,
        slots: { createMany: { data: slots } },
      },
    })

    return event
  } catch (err) {
    throw err
  }
}

export async function createInvitationInDB(eventId, expiresAt) {
  try {
    const invitation = await dbClient.invitation.create({
      data: {
        event: { connect: { id: eventId } },
        expiresAt,
      },
    })

    return invitation
  } catch (err) {
    throw err
  }
}

export async function findInvitationInDB(id) {
  try {
    const foundInvitation = await dbClient.invitation.findUnique({ where: { id } })
    return foundInvitation
  } catch (err) {
    throw err
  }
}

export async function updateEventInDB(id, data) {
  const { title, description, posterUrl, slots } = data
  console.log('slots: ', slots)
  if (!title) {
    const err = new BadRequestError('An event must have a title')
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    await dbClient.slot.deleteMany({ where: { eventId: id } })

    const updated = await dbClient.event.update({
      where: { id },
      data: {
        title,
        description,
        posterUrl,
        slots: { createMany: { data: slots } },
      },
      include: {
        slots: {
          include: {
            participants: true,
          },
        },
        invitation: true,
        host: true,
      },
    })

    return updated
  } catch (err) {
    throw err
  }
}

export async function findParticipantInDB(eventId, email) {
  if (!eventId || !email) {
    const err = new MissingInputError()
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    const found = await dbClient.participant.findUnique({
      where: {
        email_eventId: {
          eventId,
          email,
        },
      },
      include: { votedSlots: true },
    })

    return found
  } catch (err) {
    throw err
  }
}

export async function updateVoteInDB(eventId, oldEmail, votes) {
  try {
    const votesQuery = votes.map((vote) => ({ id: vote.id }))
    console.log('votes query: ', votesQuery)

    const updated = await dbClient.participant.update({
      where: {
        email_eventId: {
          eventId,
          email: oldEmail,
        },
      },
      data: {
        votedSlots: {
          connect: votesQuery,
        },
      },
      include: { votedSlots: true },
    })
    return updated
  } catch (err) {
    console.log('error: ', err)
    throw err
  }
}
