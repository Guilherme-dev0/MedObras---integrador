/*
  Warnings:

  - You are about to drop the column `produtosSelecionados` on the `medicao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `medicao` DROP COLUMN `produtosSelecionados`,
    ADD COLUMN `produtoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Medicao` ADD CONSTRAINT `Medicao_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
