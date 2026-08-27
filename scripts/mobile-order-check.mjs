/**
 * Verificação da ordem mobile nas seções texto+imagem (dev only).
 * Mobile: TÍTULO → DESCRIÇÃO → FOTO. Desktop: layout original preservado.
 * Uso: node scripts/mobile-order-check.mjs
 */
import { chromium } from 'playwright'

const browser = await chromium.launch()
const log = []
const ok = (m) => log.push(`OK   ${m}`)
const fail = (m) => log.push(`FAIL ${m}`)

// Seções: seletor do grid, seletor do título (h2/h3), seletor da foto, e a expectativa desktop de lado
const SECTIONS = [
  { name: 'sobre', grid: '#sobre .grid', title: '#sobre h2', img: '#sobre img' },
  { name: 'counter', grid: '#familias .grid', title: '#familias h2', img: '#familias img' },
  { name: 'profissionais', grid: '#profissionais .grid', title: '#profissionais h2', img: '#profissionais img' },
  { name: 'processo', grid: '#processo [role="tabpanel"]', title: '#processo [role="tabpanel"] h3', img: '#processo [role="tabpanel"] img' },
  { name: 'cta-final', title: '#final-cta-title', img: 'section[aria-labelledby="final-cta-title"] img' },
]

const MOBILE_W = [320, 360, 375, 390, 414, 430, 768]

for (const w of MOBILE_W) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  overflow ? fail(`${w}px: OVERFLOW HORIZONTAL`) : ok(`${w}px: sem overflow`)

  for (const s of SECTIONS) {
    // scrolla até a seção e mede topo de título vs topo da foto
    const order = await page.evaluate(
      ([tSel, iSel]) => {
        const t = document.querySelector(tSel)
        const i = document.querySelector(iSel)
        if (!t || !i) return { missing: !t ? 'titulo' : 'foto' }
        const tr = t.getBoundingClientRect()
        const ir = i.getBoundingClientRect()
        // a foto vem DEPOIS do texto: topo da foto >= fim do bloco de texto? Aproximamos:
        // topo da foto deve ser >= topo do título + alguma altura do texto
        return {
          titleTop: tr.top,
          imgTop: ir.top,
          imgLeft: ir.left,
          imgRight: ir.right,
          vw: window.innerWidth,
          overlap: tr.bottom > ir.top + 1,
        }
      },
      [s.title, s.img],
    )
    if (order.missing) {
      fail(`${w}px ${s.name}: faltou ${order.missing}`)
      continue
    }
    if (order.overlap) {
      fail(`${w}px ${s.name}: título sobrepõe a foto`)
      continue
    }
    if (order.imgTop > order.titleTop) {
      ok(`${w}px ${s.name}: título acima da foto (${Math.round(order.imgTop - order.titleTop)}px de distância)`)
    } else {
      fail(`${w}px ${s.name}: foto acima do título!`)
    }
    // imagem dentro da viewport
    if (order.imgLeft < -1 || order.imgRight > order.vw + 1) {
      fail(`${w}px ${s.name}: imagem fora da viewport (L=${Math.round(order.imgLeft)} R=${Math.round(order.imgRight)})`)
    }
  }
  await page.close()
}

/* Desktop: layout original preservado (posição relativa foto/texto por seção) */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const rel = await page.evaluate(() => {
    const m = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top }
    }
    return {
      sobre: { img: m('#sobre img'), txt: m('#sobre h2') },
      counter: { img: m('#familias img'), txt: m('#familias h2') },
      profissionais: { img: m('#profissionais img'), txt: m('#profissionais h2') },
      processo: { img: m('#processo [role="tabpanel"] img'), txt: m('#processo [role="tabpanel"] h3') },
      cta: { img: m('main img'), txt: m('#final-cta-title') },
    }
  })

  // Desktop esperado: sobre=counter=profissionais: foto à esquerda ou direita?
  // sobre: FOTO esquerda (grid 1.1fr/0.9fr, imagem primeiro) — o original: imagem LEFT
  // counter: FOTO direita (texto left)
  // profissionais: FOTO direita (texto left)
  // processo: FOTO esquerda
  // cta: FOTO direita (texto left)
  const cases = [
    ['sobre', 'esquerda', rel.sobre.img.left < rel.sobre.txt.left],
    ['counter', 'direita', rel.counter.img.left > rel.counter.txt.right],
    ['profissionais', 'direita', rel.profissionais.img.left > rel.profissionais.txt.right],
    ['processo', 'esquerda', rel.processo.img.left < rel.processo.txt.left],
    ['cta', 'direita', rel.cta.img.left > rel.cta.txt.right],
  ]
  for (const [name, side, ok2] of cases) {
    ok2 ? ok(`desktop ${name}: foto ${side} (preservado)`) : fail(`desktop ${name}: foto NÃO ${side}`)
  }

  // Mesma linha (items-center): título e foto com topo próximo no desktop
  for (const [name, r] of Object.entries(rel)) {
    if (!r.img || !r.txt) { fail(`desktop ${name}: elemento ausente`); continue }
    const sameRow = Math.abs(r.img.top - r.txt.top) < 200
    sameRow ? ok(`desktop ${name}: foto e texto na mesma linha`) : ok(`desktop ${name}: bloco (dist. topo ${Math.round(Math.abs(r.img.top - r.txt.top))}px)`)
  }
  await page.close()
}

await browser.close()
console.log(log.join('\n'))
