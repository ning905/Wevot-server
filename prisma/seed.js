import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const saltRounds = 8
  const password = await bcrypt.hash('123', saltRounds)
  const slots = []
  const invitations = []
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

  async function createUser(email, username, password, firstName, lastName, imgUrl) {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password,
        profile: {
          create: {
            firstName,
            lastName,
            imgUrl,
          },
        },
      },
      include: { profile: true },
    })
    return user
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
    return event
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

  async function createInvitation(inviteeEmail, eventId, slot1Id, slot2Id) {
    const query = {
      data: {
        inviteeEmail,
        eventId,
        votedSlots: {},
      },
    }

    const foundUser = await prisma.user.findUnique({ where: { email: inviteeEmail } })

    if (foundUser) {
      query.data.inviteeId = foundUser.id
    }

    if (!slot2Id) {
      query.data.votedSlots.connect = [{ id: slot1Id }]
    } else {
      query.data.votedSlots.connect = [{ id: slot1Id }, { id: slot2Id }]
    }

    const invitation = await prisma.invitation.create(query)
    return invitation
  }

  const user = await createUser(
    'user1@user.com',
    'username1',
    password,
    'Name1',
    'Surname1',
    'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=972&q=80'
  )
  console.log('User created: ', user)

  const event = await createEvent(
    'New Event',
    'This is an event description',
    '"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1686&q=80"',
    user.id
  )
  console.log('Event created: ', event)

  for (let i = 0; i < slotData.length; i++) {
    const data = slotData[i]
    const slot = await createSlot(data.startTime, data.endTime, data.location, event.id)
    slots.push(slot)
  }
  console.log('Slots created: ', slots)

  for (let i = 1; i <= 3; i++) {
    let slotsToVote
    if (i < 3) {
      slotsToVote = [slots[i - 1].id, slots[i].id]
    } else {
      slotsToVote = [slots[i - 1].id]
    }
    const invitation = await createInvitation(`user${i}@user.com`, event.id, ...slotsToVote)
    invitations.push(invitation)
  }
  console.log('Invitations created: ', invitations)
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
