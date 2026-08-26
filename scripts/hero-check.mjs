/**
 * Verificação específica do Hero mobile (dev only).
 * Uso: node scripts/hero-check.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const browser = await chromium.launch()
const log = []
const ok = (m) => log.push(`OK   ${m}`)
const fail = (m) => log.push(`FAIL ${m}`)

const viewports = [
  { name: '320', width: 320, height: 700 },
  { name: '360', width: 360, height: 800 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '414', width: 414, height: 896 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 900 },
]

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)

  const mobile = vp.width < 768

  // 1. Imagem do hero visível (desktop: composição original; mobile: composição própria)
  const heroImg = page.locator('#inicio figure img:visible')
  const imgVisible = (await heroImg.count().catch(() => 0)) > 0

  if (mobile) {
    imgVisible ? ok(`${vp.name}: imagem visível (mobile)`) : fail(`${vp.name}: imagem ausente no mobile`)
  } else {
    imgVisible ? ok(`${vp.name}: imagem visível`) : fail(`${vp.name}: imagem oculta (deveria estar visível)`)
  }

  // 2. Overflow horizontal
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth <= doc.clientWidth + 1
  })
  overflow ? ok(`${vp.name}: sem overflow`) : fail(`${vp.name}: OVERFLOW HORIZONTAL`)

  // 3. Alinhamento do título
  const titleAlign = await page
    .locator('#inicio h1')
    .evaluate((el) => getComputedStyle(el).textAlign)
    .catch(() => 'n/a')
  if (mobile) {
    titleAlign === 'center' ? ok(`${vp.name}: título centralizado`) : fail(`${vp.name}: título ${titleAlign}`)
  } else {
    titleAlign === 'left' ? ok(`${vp.name}: título à esquerda (desktop)`) : fail(`${vp.name}: título ${titleAlign}`)
  }

  // 4. Largura do título (não deve ultrapassar a viewport)
  const titleBox = await page
    .locator('#inicio h1')
    .evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, width: r.width }
    })
    .catch(() => null)
  if (titleBox) {
    const fits = titleBox.left >= 0 && titleBox.right <= vp.width + 1
    fits ? ok(`${vp.name}: título dentro da viewport (${Math.round(titleBox.width)}px)`) : fail(`${vp.name}: título fora da viewport L=${Math.round(titleBox.left)} R=${Math.round(titleBox.right)}`)
    if (mobile) {
      const centered = Math.abs(titleBox.left + titleBox.width / 2 - vp.width / 2) < 4
      centered ? ok(`${vp.name}: título horizontalmente centrado`) : fail(`${vp.name}: título deslocado`)
    }
  }

  // 5. Botões empilhados no mobile (um abaixo do outro)
  if (mobile) {
    const btns = await page.locator('#inicio a[href], #inicio button').evaluateAll((els) =>
      els
        .filter((e) => /Preciso|Quero fazer parte/.test(e.textContent ?? ''))
        .map((e) => e.getBoundingClientRect()),
    )
    if (btns.length >= 2) {
      const stacked = btns[1].top > btns[0].bottom - 2
      stacked ? ok(`${vp.name}: CTAs empilhados verticalmente`) : fail(`${vp.name}: CTAs lado a lado no mobile`)
    } else {
      fail(`${vp.name}: CTAs não encontrados`)
    }
  }

  await page.close()
}

await browser.close()
console.log(log.join('\n'))
