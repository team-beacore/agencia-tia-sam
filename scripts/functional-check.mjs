/**
 * Teste funcional dos fluxos (dev only).
 * Uso: node scripts/functional-check.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
const log = []
const ok = (msg) => log.push(`OK   ${msg}`)
const fail = (msg) => log.push(`FAIL ${msg}`)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

/* ---------- Fluxo 1: Contratar via Hero ---------- */
try {
  await page.getByRole('button', { name: /Preciso de uma profissional/ }).first().click()
  await page.waitForTimeout(800)
  ok('wizard hire: abriu')

  // Etapa 1 — serviço (com imagens)
  const step1 = await page.getByText('Qual serviço você procura?').isVisible()
  step1 ? ok('hire etapa 1: pergunta visível') : fail('hire etapa 1: pergunta ausente')
  // Continuar sem seleção deve mostrar validação amigável e não avançar
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(400)
  const validation = await page.getByRole('alert').isVisible()
  validation ? ok('hire etapa 1: validação amigável sem seleção') : fail('hire etapa 1: validação ausente')
  const stillStep1 = await page.getByText('Qual serviço você procura?').isVisible()
  stillStep1 ? ok('hire etapa 1: não avança sem seleção') : fail('hire etapa 1: avançou sem seleção')
  await page.getByRole('radio', { name: /Babá/ }).click()
  await page.waitForTimeout(1000) // auto-avanço (420ms) + transição
  const autoStep2 = await page.getByText('Para quem é esse cuidado?').isVisible()
  autoStep2 ? ok('hire etapa 2: avançou automaticamente após escolher serviço') : fail('hire etapa 2: não avançou')

  // Etapa 2 — público
  await page.getByRole('radio', { name: 'Meu filho' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(600)

  // Etapa 3 — prazo
  await page.getByRole('radio', { name: 'Nesta semana' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(600)

  // Etapa 4 — observação (opcional, preencher)
  await page.getByPlaceholder('Conte brevemente o que você precisa...').fill('Preciso de apoio nas manhãs de segunda a sexta.')

  // Teste de voltar (na etapa 4, não no resumo)
  await page.getByRole('button', { name: 'Voltar' }).click()
  await page.waitForTimeout(400)
  const backToTimeline = await page.getByRole('radio', { name: 'Nesta semana' }).isVisible()
  backToTimeline ? ok('hire: voltar funciona') : fail('hire: voltar falhou')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(400)

  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(600)

  // Etapa 5 — resumo
  const summary = await page.getByText('Seu pedido está pronto.').isVisible()
  summary ? ok('hire resumo: título visível') : fail('hire resumo: título ausente')
  await page.getByText('Serviço', { exact: true }).first().isVisible() ? ok('hire resumo: campo Serviço') : fail('hire resumo: campo Serviço ausente')
  // Verifica link do WhatsApp
  const waHref = await page.getByRole('link', { name: /Conversar com a Tia Sam/ }).getAttribute('href')
  const decoded = waHref ? decodeURIComponent(waHref) : ''
  const expectedMsg = 'Olá, Agência Tia Sam! 💜\n\nGostaria de contratar uma profissional.\n\nServiço: Babá\nNecessidade: Meu filho\nQuando: Nesta semana\n\nObservação: Preciso de apoio nas manhãs de segunda a sexta.\n\nGostaria de conversar sobre as opções disponíveis.'
  decoded.includes('wa.me/5592984146066') && decoded.includes(expectedMsg)
    ? ok('hire resumo: link WhatsApp correto (número + mensagem)')
    : fail('hire resumo: link WhatsApp inesperado: ' + waHref?.slice(0, 140))

  // Fecha e espera o modal desaparecer
  await page.getByRole('button', { name: 'Fechar assistente' }).click().catch(() => {})
  await page.waitForTimeout(200)
  // Espera o backdrop desaparecer
  try {
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 3000 })
  } catch {}
  await page.waitForTimeout(300)
  const closed = !(await page.getByText('Seu pedido está pronto.').isVisible().catch(() => false))
  closed ? ok('hire: fechou corretamente') : fail('hire: não fechou')
} catch (e) {
  fail('hire flow exception: ' + e.message)
  // Fecha o wizard se ainda estiver aberto
  await page.getByRole('button', { name: 'Fechar assistente' }).click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(600)
}

/* ---------- Fluxo 2: Profissional via seção ---------- */
try {
  await page.getByRole('button', { name: 'Quero fazer parte' }).first().click()
  await page.waitForTimeout(800)
  await page.getByRole('radio', { name: 'Cuidadora de idosos' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(500)
  await page.getByRole('radio', { name: 'Sim' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(500)
  await page.getByRole('radio', { name: 'Fixo' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(500)
  await page.getByPlaceholder(/Me conte sua experiência/).fill('Cinco anos de experiência com idosos.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.waitForTimeout(500)
  const profCta = await page.getByRole('link', { name: /Quero conversar com a Tia Sam/ }).getAttribute('href')
  const profDecoded = profCta ? decodeURIComponent(profCta) : ''
  profDecoded.includes('Oportunidade: Cuidadora de idosos') && profDecoded.includes('Experiência: Sim')
    ? ok('profissional: mensagem inclui oportunidade e experiência')
    : fail('profissional: mensagem incompleta: ' + profCta?.slice(0, 140))
  await page.getByRole('button', { name: 'Fechar assistente' }).click().catch(() => {})
  await page.waitForTimeout(200)
  try {
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 3000 })
  } catch {}
  await page.waitForTimeout(300)
  ok('profissional: fluxo completo')
} catch (e) {
  fail('professional flow exception: ' + e.message)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(600)
}

/* ---------- Menu flutuante (sem empresas) ---------- */
try {
  await page.getByRole('button', { name: 'Abrir menu do WhatsApp' }).click()
  await page.waitForTimeout(600)
  const menu = await page.getByLabel('Como podemos ajudar?').isVisible()
  menu ? ok('flutuante: menu abriu') : fail('flutuante: menu não abriu')
  const menuDialog = page.getByLabel('Como podemos ajudar?')
  const hasCompany = await menuDialog.getByRole('button', { name: 'Empresa', exact: true }).count()
  hasCompany === 0 ? ok('flutuante: sem opção Empresa') : fail('flutuante: opção Empresa ainda presente')
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(400)
} catch (e) {
  fail('flutuante check exception: ' + e.message)
}

/* ---------- ServiceExplorer pré-seleção ---------- */
try {
  await page.evaluate(() => document.querySelector('#servicos')?.scrollIntoView())
  await page.waitForTimeout(800)
  await page.getByRole('tab', { name: /Diarista/ }).click()
  await page.waitForTimeout(500)
  const cta = page.getByRole('button', { name: /Encontrar uma diarista/ })
  await cta.click()
  await page.waitForTimeout(800)
  // Deve abrir DIRETO no passo 2, sem perguntar o serviço novamente
  const step2 = await page.getByText('Para quem é esse cuidado?').isVisible()
  const banner = await page.getByText('Você escolheu', { exact: true }).isVisible()
  const noStep1 = !(await page.getByText('Qual serviço você procura?').isVisible().catch(() => false))
  step2 && banner && noStep1
    ? ok('service explorer: abre direto no passo 2 com serviço pré-selecionado')
    : fail(`service explorer: início contextual falhou (step2=${step2} banner=${banner} noStep1=${noStep1})`)
  // Alterar serviço → passo 1, com o serviço preservado
  await page.getByRole('button', { name: 'Alterar serviço' }).click()
  await page.waitForTimeout(600)
  const backStep1 = await page.getByText('Qual serviço você procura?').isVisible()
  const diaristaChecked = await page.getByRole('radio', { name: /Diarista/ }).getAttribute('aria-checked')
  backStep1 && diaristaChecked === 'true'
    ? ok('service explorer: alterar serviço volta ao passo 1 preservando a seleção')
    : fail(`service explorer: alterar serviço falhou (backStep1=${backStep1} checked=${diaristaChecked})`)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
} catch (e) {
  fail('service explorer exception: ' + e.message)
}

/* ---------- Acessibilidade básica ---------- */
try {
  const imgs = await page.locator('img').count()
  const missingAlt = await page.locator('img:not([alt])').count()
  missingAlt === 0 ? ok(`acessibilidade: todas as ${imgs} imagens têm alt`) : fail(`acessibilidade: ${missingAlt} imagens sem alt`)

  const noLang = await page.locator('html:not([lang])').count()
  noLang === 0 ? ok('acessibilidade: html tem lang') : fail('acessibilidade: html sem lang')
} catch (e) {
  fail('a11y check exception: ' + e.message)
}

await browser.close()
console.log(log.join('\n'))
