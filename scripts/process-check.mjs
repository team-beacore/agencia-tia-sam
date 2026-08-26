/**
 * Verificação da nova seção de Processo (dev only).
 * Uso: node scripts/process-check.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const browser = await chromium.launch()
const log = []
const ok = (m) => log.push(`OK   ${m}`)
const fail = (m) => log.push(`FAIL ${m}`)

const TITLES = ['Cadastro', 'Triagem', 'Documentação', 'Antecedentes', 'Referências', 'Entrevista', 'Aprovação', 'Oportunidades']

/* ---------- Desktop: as 8 etapas clicáveis ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#processo')?.scrollIntoView())
  await page.waitForTimeout(1200)

  for (let i = 0; i < 8; i++) {
    const tab = page.getByRole('tab', { name: new RegExp(TITLES[i], 'i') })
    await tab.click()
    await page.waitForTimeout(450)
    const title = await page.locator('#processo h3').textContent()
    const num = await page.locator('#processo [role="tabpanel"] p').first().textContent()
    const imgSrc = await page.locator('#processo [role="tabpanel"] img').getAttribute('src')
    title?.trim() === TITLES[i]
      ? ok(`etapa ${i + 1}: título "${TITLES[i]}"`)
      : fail(`etapa ${i + 1}: título "${title?.trim()}"`)
    num?.trim() === String(i + 1).padStart(2, '0')
      ? ok(`etapa ${i + 1}: número ${num?.trim()}`)
      : fail(`etapa ${i + 1}: número ${num?.trim()}`)
    if (i === 0 || i === 3 || i === 7) {
      imgSrc && imgSrc.includes('/images/process/')
        ? ok(`etapa ${i + 1}: imagem real carregada`)
        : fail(`etapa ${i + 1}: imagem ausente`)
    }
  }

  // Imagens das 8 etapas carregam (status 200)
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  for (const t of TITLES) {
    const r = await page2.request.get(`${BASE}/images/process/${String(TITLES.indexOf(t) + 1).padStart(2, '0')}${t === 'Triagem' ? '-triagem' : ''}.jpg`)
    // nomes: 01-cadastro, 02-triagem, 03-antecedentes...
  }
  const files = [
    '01-cadastro.jpg', '02-triagem.jpg', '02-documentacao.jpg',
    '03-antecedentes.jpg', '04-referencias.jpg', '05-entrevista.jpg',
    '06-aprovacao.jpg', '07-oportunidades.jpg',
  ]
  for (const f of files) {
    const r = await page2.request.get(`${BASE}/images/process/${f}`)
    r.ok() ? ok(`imagem carrega: ${f}`) : fail(`imagem NÃO carrega: ${f} (${r.status()})`)
  }
  await page2.close()

  // Autoplay avança sozinho (mouse fora da seção para não pausar por hover)
  await page.mouse.move(10, 10)
  await page.waitForTimeout(600)
  const before = await page.locator('#processo h3').textContent()
  await page.waitForTimeout(5200)
  const after = await page.locator('#processo h3').textContent()
  before !== after
    ? ok(`autoplay: avançou de "${before?.trim()}" para "${after?.trim()}"`)
    : fail(`autoplay: não avançou (${before?.trim()})`)

  // Overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  overflow ? ok('desktop: sem overflow') : fail('desktop: OVERFLOW')
  await page.close()
}

/* ---------- Teclado: setas navegam entre etapas ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#processo')?.scrollIntoView())
  await page.waitForTimeout(1000)
  const tab = page.getByRole('tab', { name: /Cadastro/i })
  await tab.focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(950)
  const t = await page.locator('#processo h3').textContent()
  t?.trim() === 'Triagem' ? ok('teclado: seta direita avança') : fail(`teclado: esperava Triagem, veio "${t?.trim()}"`)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(950)
  const t2 = await page.locator('#processo h3').textContent()
  t2?.trim() === 'Cadastro' ? ok('teclado: seta esquerda volta') : fail(`teclado: esperava Cadastro, veio "${t2?.trim()}"`)
  await page.close()
}

/* ---------- Mobile: pills, pager, overflow, centralização ---------- */
for (const w of [320, 390, 430]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#processo')?.scrollIntoView())
  await page.waitForTimeout(1200)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  overflow ? ok(`${w}px: sem overflow`) : fail(`${w}px: OVERFLOW HORIZONTAL`)

  // Pager mobile funciona
  await page.getByRole('button', { name: 'Próxima etapa' }).click()
  await page.waitForTimeout(450)
  const t = await page.locator('#processo h3').textContent()
  t?.trim() === 'Triagem' ? ok(`${w}px: pager avança`) : fail(`${w}px: pager não avançou (${t?.trim()})`)

  // Pills clicáveis (toque)
  await page.getByRole('tab', { name: /Entrevista/i }).click()
  await page.waitForTimeout(450)
  const t2 = await page.locator('#processo h3').textContent()
  t2?.trim() === 'Entrevista' ? ok(`${w}px: pill toque funciona`) : fail(`${w}px: pill falhou (${t2?.trim()})`)

  // Imagem dentro da viewport
  const imgBox = await page.locator('#processo [role="tabpanel"] img').evaluate((e) => {
    const r = e.getBoundingClientRect()
    return { left: r.left, right: r.right, vw: window.innerWidth }
  })
  imgBox.left >= 0 && imgBox.right <= imgBox.vw + 1
    ? ok(`${w}px: imagem dentro da viewport`)
    : fail(`${w}px: imagem estourou (L=${Math.round(imgBox.left)} R=${Math.round(imgBox.right)})`)
  await page.close()
}

/* ---------- Tablet: scroll apenas dentro da timeline ---------- */
{
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#processo')?.scrollIntoView())
  await page.waitForTimeout(1000)
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  pageOverflow ? ok('tablet 768: página sem overflow') : fail('tablet 768: página com overflow')
  const timeline = await page.locator('#processo [role="tablist"]').last()
  const scrollable = await timeline.evaluate((e) => e.scrollWidth > e.clientWidth)
  scrollable ? ok('tablet 768: timeline com scroll interno') : ok('tablet 768: timeline sem necessidade de scroll')
  await page.close()
}

/* ---------- Reduced motion: autoplay desligado, seção visível ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#processo')?.scrollIntoView())
  await page.waitForTimeout(1000)
  const before = await page.locator('#processo h3').textContent()
  await page.waitForTimeout(5200)
  const after = await page.locator('#processo h3').textContent()
  before === after ? ok('reduced-motion: autoplay desligado') : fail('reduced-motion: autoplay ativo (não deveria)')
  const title = await page.locator('#processo h3').isVisible()
  title ? ok('reduced-motion: conteúdo visível') : fail('reduced-motion: conteúdo invisível')
  await ctx.close()
}

await browser.close()
console.log(log.join('\n'))
