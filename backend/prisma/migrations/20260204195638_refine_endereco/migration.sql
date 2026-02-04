/*
  Warnings:

  - You are about to drop the column `estado` on the `endereco` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `endereco` DROP COLUMN `estado`,
    MODIFY `numero` VARCHAR(191) NULL;
