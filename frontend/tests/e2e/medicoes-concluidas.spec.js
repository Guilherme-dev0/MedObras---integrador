import { test, expect } from '@playwright/test'

test.describe('Medições Concluídas - fluxo fim-a-fim no frontend', () => {
  test('editar item pelo tooltip atualiza área e total instantaneamente', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token')
    })

    const medicao = {
      id: 1,
      status: 'concluida',
      dataAgendada: new Date().toISOString(),
      cliente: { nome: 'Cliente Teste' },
      endereco: { logradouro: 'Rua A', bairro: 'Centro', cidade: 'São Paulo' },
      produtosSelecionados: [
        { id: 10, nome: 'Item A', quantidade: 1, altura: 2.0, largura: 1.5 },
        { id: 11, nome: 'Item B', quantidade: 2, altura: null, largura: null },
      ],
      observacao: 'Obs de teste'
    }

    await page.route('**/api/medicoes/concluidas**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([medicao]),
      })
    })

    await page.route('**/api/medicoes/1', async (route) => {
      if (route.request().method() === 'PUT') {
        const req = await route.request().postDataJSON()
        medicao.produtosSelecionados = req.produtosSelecionados
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/medicoes/concluidas')

    const row = page.getByRole('row', { name: /Cliente Teste/i })
    await expect(row).toBeVisible()

    await page.getByText(/3 itens/).hover()
    const tooltipItemB = page.locator('.tooltip-box .tooltip-row').filter({ hasText: /Item B/i })
    await tooltipItemB.click()

    const modal = page.locator('.modal')
    await expect(modal).toBeVisible()
    const inputs = modal.locator('input[type="number"]')
    await inputs.nth(0).fill('2.5') // Altura
    await inputs.nth(1).fill('3')   // Largura
    await modal.getByRole('button', { name: /Salvar/i }).click()

    const updatedRow = page.getByRole('row', { name: /Cliente Teste/i })
    await expect(updatedRow.locator('td').nth(5)).toHaveText(/18\.00 m²/)

    const areaTotalCard = page.locator('.stat-card.refined').nth(1).locator('.stat-value')
    await expect(areaTotalCard).toHaveText(/18\.00 m²/)
  })
})
