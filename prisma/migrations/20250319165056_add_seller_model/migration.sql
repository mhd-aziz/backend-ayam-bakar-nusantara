-- CreateTable
CREATE TABLE `Seller` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` VARCHAR(191) NOT NULL,
    `storeName` VARCHAR(191) NOT NULL,
    `storeDescription` VARCHAR(191) NULL,
    `storeAddress` VARCHAR(191) NOT NULL,
    `storeCoordinates` JSON NOT NULL,
    `storeImage` VARCHAR(191) NOT NULL,
    `customGoogleMapLink` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Seller_sellerId_key`(`sellerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Seller` ADD CONSTRAINT `Seller_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AuthUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
