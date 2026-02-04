/*
  Warnings:

  - Added the required column `estado` to the `Endereco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `Endereco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `empresa` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `endereco` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `estado` VARCHAR(191) NOT NULL,
    ADD COLUMN `numero` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `medicao` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `descricao` TEXT NULL;

-- AlterTable
ALTER TABLE `produto` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
