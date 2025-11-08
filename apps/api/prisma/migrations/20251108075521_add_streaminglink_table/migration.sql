-- CreateTable
CREATE TABLE `StreamingLink` (
    `id` VARCHAR(191) NOT NULL,
    `videoId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StreamingLink_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StreamingLink` ADD CONSTRAINT `StreamingLink_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
