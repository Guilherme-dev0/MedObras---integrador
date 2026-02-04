/*
  Warnings:

  - You are about to drop the column `imagem` on the `medicao` table. All the data in the column will be lost.
  - You are about to drop the column `produtoId` on the `medicao` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf,empresaId]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `medicao` DROP FOREIGN KEY `Medicao_produtoId_fkey`;

-- DropIndex
DROP INDEX `Cliente_cpf_key` ON `cliente`;

-- DropIndex
DROP INDEX `Medicao_produtoId_fkey` ON `medicao`;

-- AlterTable
ALTER TABLE `medicao` DROP COLUMN `imagem`,
    DROP COLUMN `produtoId`,
    ADD COLUMN `produtosSelecionados` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Cliente_cpf_empresaId_key` ON `Cliente`(`cpf`, `empresaId`);
