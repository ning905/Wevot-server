import dbClient from '../../utils/dbClient.js'
import { BadRequestError, MissingInputError } from '../../utils/Errors.js'
import { sendMessageResponse } from '../../utils/serverResponse.js'

export async function findEventInDB(id) {
  try {
    const foundEvent = await dbClient.event.findUnique({
      where: { id },
      include: {
        participants: { include: { votedSlots: true } },
        slots: {
          include: {
            participants: true,
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
    const invitation = await dbClient.invitation.upsert({
      where: {
        eventId,
      },
      update: {
        expiresAt,
      },
      create: {
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

export async function updateEventInDB(eventId, data, res) {
  const { title, description, posterUrl, slots } = data
  if (!title) {
    const err = new BadRequestError('An event must have a title')
    return sendMessageResponse(res, err.code, err.message)
  }

  try {
    const noUpdateSlotIds = []
    const slotsToAdd = []

    slots.forEach((s) => {
      if (s.id) {
        noUpdateSlotIds.push(s.id)
      } else {
        slotsToAdd.push(s)
      }
    })

    const slotsDeleteQuery = { where: { eventId } }

    if (noUpdateSlotIds.length) {
      slotsDeleteQuery.where = {
        AND: [{ eventId }, { id: { notIn: noUpdateSlotIds } }],
      }
    }
    await dbClient.slot.deleteMany(slotsDeleteQuery)

    const updated = await dbClient.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        posterUrl,
        slots: {
          createMany: {
            data: slotsToAdd,
          },
        },
      },
      include: {
        participants: true,
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

export async function findParticipantInDB(eventId, email, res) {
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
    throw err
  }
}
