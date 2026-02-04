import { test, expect } from '@playwright/test'

test.describe('Medições Concluídas - limpeza de UI e tooltip', () => {
  test('tooltip fecha ao clicar fora e não existem atributos title nativos', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token')
    })

    const medicao = {
      id: 1,
      status: 'concluida',
      dataAgendada: new Date().toISOString(),
      cliente: { nome: 'Cliente UI' },
      endereco: { logradouro: 'Rua X', bairro: 'Centro', cidade: 'São Paulo' },
      produtosSelecionados: [
        { id: 10, nome: 'Item X', quantidade: 1, altura: 2.0, largura: 1.5 },
      ],
      observacao: ''
    }

    await page.route('**/api/medicoes/concluidas**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([medicao]),
      })
    })

    await page.goto('/medicoes/concluidas')
    await page.getByText(/1 itens/).hover()
    const tooltip = page.locator('.tooltip-box')
    await expect(tooltip).toBeVisible()

    await page.getByRole('heading', { name: 'Medições Concluídas' }).click()
    await expect(tooltip).toHaveCount(0)

    const titles = await page.locator('[title]').count()
    expect(titles).toBe(0)
  })
})
