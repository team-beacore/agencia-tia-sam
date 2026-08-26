/**
 * Script de verificação visual (dev only — não faz parte do site).
 * Tira screenshots em várias resoluções e testa os fluxos principais.
 * Uso: node scripts/visual-check.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:4173'
const OUT = 'scripts/shots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()

const results = []

async function checkOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })
  const ok = overflow.scrollWidth <= overflow.clientWidth + 1
  results.push(`${ok ? 'OK ' : 'FAIL'} overflow ${label}: scroll=${overflow.scrollWidth} client=${overflow.clientWidth}`)
  if (!ok) console.log('  -> horizontal overflow detected!')
}

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-320', width: 320, height: 700 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-1920', width: 1920, height: 1080 },
]

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${vp.name}-top.png` })
  await checkOverflow(page, vp.name)

  // Rolagem incremental com screenshots
  const height = await page.evaluate(() => document.body.scrollHeight)
  const steps = Math.min(6, Math.floor(height / (vp.height * 0.9)))
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), (height / steps) * i)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/${vp.name}-scroll-${i}.png` })
    if (i === 2) await checkOverflow(page, `${vp.name} scroll`)
  }

  // Teste do wizard no mobile
  if (vp.width <= 430) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    const opened = await page
      .locator('text=Preciso de uma profissional')
      .first()
      .click({ timeout: 3000 })
      .then(() => true)
      .catch(() => false)
    if (opened) {
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${OUT}/${vp.name}-wizard.png` })
      // seleciona uma opção
      await page.locator('text=Babá').first().click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${OUT}/${vp.name}-wizard-option.png` })
      // fecha
      await page.locator('[aria-label="Fechar assistente"]').click().catch(() => {})
    } else {
      results.push(`WARN wizard ${vp.name}: botão não encontrado`)
    }
  }

  // Menu mobile
  if (vp.width <= 1024) {
    await page.locator('[aria-label="Abrir menu"]').click().catch(() => {})
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${OUT}/${vp.name}-menu.png` })
    await page.keyboard.press('Escape')
  }

  await page.close()
}

await browser.close()
console.log(results.join('\n'))
