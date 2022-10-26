import { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { hashData } from '../src/utils/hashData.js'

const prisma = new PrismaClient()

async function main() {
  const password = await hashData('123')
  const slots = []
  const participants = []
  const slotData = [
    {
      startTime: new Date('November 17, 2022 09:30:00'),
      endTime: new Date('November 17, 2022 12:30:00'),
      location: 'Manchester',
    },
    {
      startTime: new Date('November 17, 2022 16:30:00'),
      endTime: new Date('November 17, 2022 18:30:00'),
      location: 'Manchester',
    },
    {
      startTime: new Date('November 17, 2022 09:30:00'),
      endTime: new Date('November 17, 2022 12:30:00'),
      location: 'London',
    },
  ]

  async function createUser(email, username, password, imgUrl) {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password,
        isVerified: true,
        profileImgUrl: imgUrl,
      },
    })
    return user
  }

  async function createInvitation(eventId, expiresAt) {
    const invitation = await prisma.invitation.create({
      data: {
        eventId,
        expiresAt,
      },
    })
    return invitation
  }

  async function createEvent(title, description, posterUrl, hostId) {
    const event = await prisma.event.create({
      data: {
        title,
        description,
        posterUrl,
        hostId,
      },
    })

    const invitation = await createInvitation(event.id, new Date('November 27, 2022 09:30:00'))

    return { event, invitation }
  }

  async function createSlot(startTime, endTime, location, eventId) {
    const slot = await prisma.slot.create({
      data: {
        startTime,
        endTime,
        location,
        eventId,
      },
    })
    return slot
  }

  async function createParticipant(email, eventId, slot1Id, slot2Id) {
    const query = {
      data: {
        email,
        eventId,
        votedSlots: {},
      },
    }

    if (!slot2Id) {
      query.data.votedSlots.connect = [{ id: slot1Id }]
    } else {
      query.data.votedSlots.connect = [{ id: slot1Id }, { id: slot2Id }]
    }

    const participant = await prisma.participant.create(query)
    return participant
  }

  const user = await createUser(
    'user1@user.com',
    'username1',
    password,
    'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=972&q=80'
  )
  console.log('User created: ', user)

  const { event, invitation } = await createEvent(
    'New Event',
    'This is an event description',
    '"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1686&q=80"',
    user.id
  )
  console.log('Event created: ', event)
  console.log('Invitation created: ', invitation)

  for (let i = 0; i < slotData.length; i++) {
    const data = slotData[i]
    const slot = await createSlot(data.startTime, data.endTime, data.location, event.id)
    slots.push(slot)
  }
  console.log('Slots created: ', slots)

  for (let i = 1; i <= 3; i++) {
    let votedSlots
    if (i < 3) {
      votedSlots = [slots[i - 1].id, slots[i].id]
    } else {
      votedSlots = [slots[i - 1].id]
    }
    const participant = await createParticipant(`user${i}@user.com`, event.id, ...votedSlots)
    participants.push(participant)
  }
  console.log('Participants created: ', participants)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
