-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_sellerId_fkey`;

-- DropIndex
DROP INDEX `Product_sellerId_fkey` ON `product`;

-- AlterTable
ALTER TABLE `product` MODIFY `sellerId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`sellerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
