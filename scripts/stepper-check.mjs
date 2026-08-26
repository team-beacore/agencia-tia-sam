/**
 * Verificação do Stepper contextual de contratação (dev only).
 * 10 cenários obrigatórios.
 * Uso: node scripts/stepper-check.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const browser = await chromium.launch()
const log = []
const ok = (m) => log.push(`OK   ${m}`)
const fail = (m) => log.push(`FAIL ${m}`)

async function closeWizard(page) {
  await page.getByRole('button', { name: 'Fechar assistente' }).click({ timeout: 3000 }).catch(() => {})
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)
}

async function openHeroWizard(page) {
  await page.getByRole('button', { name: /Preciso de uma profissional/ }).first().click()
  await page.waitForTimeout(700)
}

/* Cenários 1–3: Hero → serviço → auto-avanço para o passo 2 */
for (const [service, label] of [
  ['Babá', 'Babá'],
  ['Diarista', 'Diarista'],
  ['Cuidadora de idosos', 'Cuidadora de idosos'],
]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    const step1 = await page.getByText('Qual serviço você procura?').isVisible()
    step1 ? ok(`${service}: passo 1 aberto pelo Hero`) : fail(`${service}: passo 1 ausente`)

    await page.getByRole('radio', { name: new RegExp(service) }).click()
    await page.waitForTimeout(1000) // auto-avanço (420ms) + transição

    const dialog = page.getByRole('dialog')
    const step2 = await page.getByText('Para quem é esse cuidado?').isVisible()
    const banner = await dialog.getByText('Você escolheu', { exact: true }).isVisible()
    const labelShown = await dialog.getByText(label, { exact: true }).isVisible()
    step2 && banner && labelShown
      ? ok(`${service}: avançou para o passo 2 com "Você escolheu ${label}"`)
      : fail(`${service}: passo 2/banner incompleto (step2=${step2} banner=${banner} label=${labelShown})`)
  } catch (e) {
    fail(`${service}: exceção ${e.message}`)
  }
  await page.close()
}

/* Cenários 4–6: seção de serviços → "Contratar" → abre direto no passo 2 */
for (const [tabName, ctaName, label] of [
  ['Babá', 'Encontrar uma babá', 'Babá'],
  ['Diarista', 'Encontrar uma diarista', 'Diarista'],
  ['Passadeira', 'Encontrar uma passadeira', 'Passadeira'],
]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await page.evaluate(() => document.querySelector('#servicos')?.scrollIntoView())
    await page.waitForTimeout(600)
    await page.getByRole('tab', { name: new RegExp(tabName) }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: new RegExp(ctaName) }).click()
    await page.waitForTimeout(800)

    const step2 = await page.getByText('Para quem é esse cuidado?').isVisible()
    const banner = await page.getByRole('dialog').getByText(label, { exact: true }).isVisible()
    const noStep1 = !(await page.getByText('Qual serviço você procura?').isVisible().catch(() => false))
    step2 && banner && noStep1
      ? ok(`${tabName}: abriu direto no passo 2 com serviço pré-selecionado (passo 1 não aparece)`)
      : fail(`${tabName}: falha no início contextual (step2=${step2} banner=${banner} noStep1=${noStep1})`)
  } catch (e) {
    fail(`${tabName}: exceção ${e.message}`)
  }
  await page.close()
}

/* Cenário 7: Alterar serviço → volta ao passo 1 e preserva seleção */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    await page.getByRole('radio', { name: /Babá/ }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Alterar serviço' }).click()
    await page.waitForTimeout(600)
    const backStep1 = await page.getByText('Qual serviço você procura?').isVisible()
    const babaStill = await page.getByRole('radio', { name: /Babá/ }).getAttribute('aria-checked')
    backStep1 && babaStill === 'true'
      ? ok('alterar serviço: voltou ao passo 1 com Babá selecionada')
      : fail(`alterar serviço: (backStep1=${backStep1} checked=${babaStill})`)
    // troca para Cuidadora → auto-avança com o novo serviço
    await page.getByRole('radio', { name: /Cuidadora de idosos/ }).click()
    await page.waitForTimeout(1000)
    const newLabel = await page.getByRole('dialog').getByText('Cuidadora de idosos', { exact: true }).isVisible()
    newLabel ? ok('alterar serviço: novo serviço aplicado no passo 2') : fail('alterar serviço: novo serviço não aplicado')
  } catch (e) {
    fail('alterar serviço: exceção ' + e.message)
  }
  await page.close()
}

/* Cenário 8: Voltar → passo anterior */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    await page.getByRole('radio', { name: /Babá/ }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('radio', { name: 'Meu filho' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForTimeout(600)
    const step3 = await page.getByText('Quando você precisa?').isVisible()
    step3 ? ok('voltar: chegou ao passo 3') : fail('voltar: passo 3 ausente')
    await page.getByRole('button', { name: 'Voltar' }).click()
    await page.waitForTimeout(600)
    const backStep2 = await page.getByText('Para quem é esse cuidado?').isVisible()
    backStep2 ? ok('voltar: retornou ao passo 2') : fail('voltar: não retornou ao passo 2')
  } catch (e) {
    fail('voltar: exceção ' + e.message)
  }
  await page.close()
}

/* Cenário 9: Fechar → fluxo encerrado */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    const open = await page.getByRole('dialog').isVisible()
    open ? ok('fechar: wizard aberto') : fail('fechar: wizard não abriu')
    await closeWizard(page)
    try {
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 3000 })
    } catch {}
    const closed = (await page.locator('[role="dialog"]').count()) === 0
    closed ? ok('fechar: fluxo encerrado (modal fechado)') : fail('fechar: modal ainda presente')
  } catch (e) {
    fail('fechar: exceção ' + e.message)
  }
  await page.close()
}

/* Cenário 10: Finalizar → resumo → WhatsApp com dados corretos */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    await page.getByRole('radio', { name: /Babá/ }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('radio', { name: 'Meu filho' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForTimeout(600)
    await page.getByRole('radio', { name: 'Nesta semana' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForTimeout(600)
    await page.getByPlaceholder('Conte brevemente o que você precisa...').fill('Preciso de apoio nas manhãs.')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForTimeout(700)

    const summary = await page.getByText('Seu pedido está pronto.').isVisible()
    summary ? ok('finalizar: resumo visível') : fail('finalizar: resumo ausente')
    const waHref = await page.getByRole('link', { name: /Conversar com a Tia Sam/ }).getAttribute('href')
    const decoded = waHref ? decodeURIComponent(waHref) : ''
    decoded.includes('wa.me/5592984146066') &&
      decoded.includes('Serviço: Babá') &&
      decoded.includes('Necessidade: Meu filho') &&
      decoded.includes('Quando: Nesta semana') &&
      decoded.includes('Observação: Preciso de apoio nas manhãs.')
      ? ok('finalizar: WhatsApp com serviço preservado + dados completos')
      : fail('finalizar: WhatsApp incompleto: ' + waHref?.slice(0, 160))
  } catch (e) {
    fail('finalizar: exceção ' + e.message)
  }
  await page.close()
}

/* Validação: Continuar sem seleção mostra mensagem amigável e não avança */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  try {
    await openHeroWizard(page)
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForTimeout(400)
    const msg = await page.getByRole('alert').isVisible()
    const stillStep1 = await page.getByText('Qual serviço você procura?').isVisible()
    msg && stillStep1
      ? ok('validação: mensagem amigável + não avança sem serviço')
      : fail(`validação: (msg=${msg} stillStep1=${stillStep1})`)
  } catch (e) {
    fail('validação: exceção ' + e.message)
  }
  await page.close()
}

await browser.close()
console.log(log.join('\n'))
