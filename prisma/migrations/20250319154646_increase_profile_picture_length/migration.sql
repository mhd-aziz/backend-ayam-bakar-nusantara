/*
  Warnings:

  - Made the column `profilePicture` on table `userprofile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `userprofile` MODIFY `profilePicture` VARCHAR(1024) NOT NULL;
