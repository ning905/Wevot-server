/*
  Warnings:

  - You are about to drop the column `inviteeEmail` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `inviteeId` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the `_InvitationToSlot` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[uniqueString]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueString` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('PENDING', 'BOOKED');

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_inviteeId_fkey";

-- DropForeignKey
ALTER TABLE "_InvitationToSlot" DROP CONSTRAINT "_InvitationToSlot_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvitationToSlot" DROP CONSTRAINT "_InvitationToSlot_B_fkey";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "inviteeEmail",
DROP COLUMN "inviteeId",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uniqueString" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "status" "SlotStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "_InvitationToSlot";

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantToSlot" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantToSlot_AB_unique" ON "_ParticipantToSlot"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantToSlot_B_index" ON "_ParticipantToSlot"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_uniqueString_key" ON "Invitation"("uniqueString");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_eventId_key" ON "Invitation"("eventId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantToSlot" ADD CONSTRAINT "_ParticipantToSlot_A_fkey" FOREIGN KEY ("A") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantToSlot" ADD CONSTRAINT "_ParticipantToSlot_B_fkey" FOREIGN KEY ("B") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
