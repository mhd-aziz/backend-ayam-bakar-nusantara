/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Seller` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Seller_userId_key` ON `Seller`(`userId`);
