import { test, expect } from '@playwright/test'

test.describe('Medições Concluídas - filtros e busca', () => {
  test('filtra por nome e intervalo de datas', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token')
    })

    const hoje = new Date()
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000)

    const medA = {
      id: 1,
      status: 'concluida',
      dataAgendada: ontem.toISOString(),
      cliente: { nome: 'Cliente Alpha' },
      endereco: { logradouro: 'Rua A', bairro: 'Centro', cidade: 'São Paulo' },
      produtosSelecionados: [{ id: 10, nome: 'Item A', quantidade: 1, altura: 2, largura: 1 }],
      observacao: 'Alpha obs'
    }
    const medB = {
      id: 2,
      status: 'concluida',
      dataAgendada: amanha.toISOString(),
      cliente: { nome: 'Cliente Beta' },
      endereco: { logradouro: 'Rua B', bairro: 'Centro', cidade: 'São Paulo' },
      produtosSelecionados: [{ id: 20, nome: 'Item B', quantidade: 1, altura: 1, largura: 1 }],
      observacao: 'Beta obs'
    }

    await page.route('**/api/medicoes/concluidas**', async (route) => {
      const url = route.request().url()
      const u = new URL(url)
      const q = u.searchParams.get('q')
      const de = u.searchParams.get('de')
      const ate = u.searchParams.get('ate')

      let lista = [medA, medB]
      if (q) {
        lista = lista.filter(m => (m.cliente?.nome || '').toLowerCase().includes(q.toLowerCase()))
      }
      if (de) {
        lista = lista.filter(m => (m.dataAgendada || '').slice(0, 10) >= de)
      }
      if (ate) {
        lista = lista.filter(m => (m.dataAgendada || '').slice(0, 10) <= ate)
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lista),
      })
    })

    await page.goto('/medicoes/concluidas')
    await expect(page.getByRole('row', { name: /Cliente Alpha/i })).toBeVisible()
    await expect(page.getByRole('row', { name: /Cliente Beta/i })).toBeVisible()

    await page.fill('.search-input', 'Alpha')
    await page.getByRole('button', { name: /Aplicar/i }).click()
    await expect(page.getByRole('row', { name: /Cliente Alpha/i })).toBeVisible()
    await expect(page.getByRole('row', { name: /Cliente Beta/i })).toHaveCount(0)

    await page.fill('.search-input', '')
    await page.locator('.date-input').nth(0).fill(hoje.toISOString().slice(0, 10))
    await page.locator('.date-input').nth(1).fill(amanha.toISOString().slice(0, 10))
    await page.getByRole('button', { name: /Aplicar/i }).click()
    await expect(page.getByText(/Cliente Beta/i)).toBeVisible()
    await expect(page.getByText(/Cliente Alpha/i)).toHaveCount(0)
  })
})
