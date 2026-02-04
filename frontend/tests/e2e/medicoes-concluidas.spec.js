import { test, expect } from '@playwright/test'

test.describe('Medições Concluídas - fluxo fim-a-fim no frontend', () => {
  test('visualizar item pelo tooltip atualiza Altura/Largura/Área da linha e mantém total', async ({ page }) => {
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
        { id: 11, nome: 'Item B', quantidade: 2, altura: 2.5, largura: 3 },
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

    let putCalled = false
    await page.route('**/api/medicoes/1', async (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true
      }
      await route.continue()
    })

    await page.goto('/medicoes/concluidas')

    const row = page.getByRole('row', { name: /Cliente Teste/i })
    await expect(row).toBeVisible()

    // estado inicial: área é soma total (2*1.5*1 + 2.5*3*2 = 18.0)
    await expect(row.locator('td').nth(5)).toHaveText(/18\.00 m²/)

    await page.getByText(/3 itens/).hover()
    const tooltipItemB = page.locator('.tooltip-box .tooltip-row').filter({ hasText: /Item B/i })
    await tooltipItemB.click()

    // após visualizar: altura/largura e área da linha refletem o item B (2.5 * 3 * 2 = 15)
    await expect(row.locator('td').nth(3)).toHaveText(/2\.50|2\.5/)
    await expect(row.locator('td').nth(4)).toHaveText(/3\.00|3/)
    await expect(row.locator('td').nth(5)).toHaveText(/15\.00 m²/)
    // card total permanece 18.00 m²
    const areaTotalCard = page.locator('.stat-card.refined').nth(1).locator('.stat-value')
    await expect(areaTotalCard).toHaveText(/18\.00 m²/)
    // nenhuma gravação foi feita
    expect(putCalled).toBeFalsy()
  })
})
