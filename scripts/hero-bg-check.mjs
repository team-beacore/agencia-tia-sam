/**
 * Verificação do background do Hero (dev only).
 * Decodifica o screenshot e mede os pixels reais: centro branco, bordas lilás suave.
 * Uso: node scripts/hero-bg-check.mjs
 */
import { chromium } from 'playwright'
import zlib from 'node:zlib'

/* --- Mini decoder PNG (colortype 2/RGB e 6/RGBA, bitdepth 8) --- */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG')
  let width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  let pos = 8
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8)
      height = buf.readUInt32BE(pos + 12)
      bitDepth = buf[pos + 16]
      colorType = buf[pos + 17]
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(pos + 8, pos + 8 + len))
    }
    pos += 12 + len
  }
  if (bitDepth !== 8) throw new Error(`bitdepth ${bitDepth} não suportado`)
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  if (!bpp) throw new Error(`colortype ${colorType} não suportado`)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const out = Buffer.alloc(height * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[x] = v & 0xff
    }
    prev = Buffer.from(cur)
  }
  return { width, height, data: out, bpp }
}

function hex(c) {
  return '#' + [c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const browser = await chromium.launch()
const log = []
const ok = (m) => log.push(`OK   ${m}`)
const fail = (m) => log.push(`FAIL ${m}`)

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// Background computado
const bg = await page.locator('#inicio').evaluate((el) => getComputedStyle(el).backgroundImage)
bg.includes('radial-gradient')
  ? ok('background: radial-gradient aplicado')
  : fail('background: sem radial-gradient: ' + bg.slice(0, 80))

// Screenshot do Hero
const box = await page.locator('#inicio').boundingBox()
const shot = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 900) } })
const png = decodePng(shot)
const W = png.width, H = png.height, d = png.data, bpp = png.bpp

const sample = (fx, fy) => {
  const x = Math.min(W - 1, Math.max(0, Math.round(fx * W)))
  const y = Math.min(H - 1, Math.max(0, Math.round(fy * H)))
  const i = (y * W + x) * bpp
  return [d[i], d[i + 1], d[i + 2]]
}
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const points = {
  centro: sample(0.5, 0.45),
  cantoSupEsq: sample(0.03, 0.03),
  cantoSupDir: sample(0.97, 0.03),
  cantoInfEsq: sample(0.03, 0.95),
  cantoInfDir: sample(0.97, 0.95),
  bordaSupCentro: sample(0.5, 0.01),
  bordaDirMeio: sample(0.98, 0.5),
}

console.log('  amostras de cor (RGB):')
for (const [k, v] of Object.entries(points)) {
  console.log(`    ${k.padEnd(14)} ${hex(v)}  luminância=${lum(v).toFixed(1)}`)
}

// Centro deve ser branco/off-white (luminância alta, ~>240)
const centerLum = lum(points.centro)
centerLum > 240 ? ok(`centro branco/off-white (luminância ${centerLum.toFixed(1)})`) : fail(`centro escuro demais (${centerLum.toFixed(1)})`)

// Branco dominante: pelo menos 60% da área deve ter luminância > 235
let whitePx = 0, total = 0
for (let y = 0; y < H; y += 4) {
  for (let x = 0; x < W; x += 4) {
    const i = (y * W + x) * bpp
    if (lum([d[i], d[i + 1], d[i + 2]]) > 235) whitePx++
    total++
  }
}
const pct = (whitePx / total) * 100
pct > 60 ? ok(`predominância branca: ${pct.toFixed(0)}% da área clara (>235)`) : fail(`branco em apenas ${pct.toFixed(0)}%`)

// Lilás deve ser perceptível apenas nas bordas (canal azul > vermelho, sem saturação forte)
const corner = points.cantoSupEsq
const lilacSoft = corner[2] > corner[0] && corner[2] - corner[0] < 15 && corner[2] < 253 && corner[0] > 235
lilacSoft ? ok('borda: lilás extremamente suave (azul levemente acima, sem saturação)') : fail(`borda: ${hex(corner)} não parece lilás suave`)

// Sem overflow e layout intacto
const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
overflow ? ok('sem overflow horizontal') : fail('overflow horizontal!')
const imgVisible = await page.locator('#inicio figure img').first().isVisible()
imgVisible ? ok('imagem do hero intacta') : fail('imagem do hero sumiu')
const title = await page.locator('#inicio h1').textContent()
title?.includes('Cuidado') ? ok('título intacto') : fail('título alterado')

// Mobile: mesmo conceito sutil
for (const w of [390, 430]) {
  const m = await browser.newPage({ viewport: { width: w, height: 844 } })
  await m.goto('http://localhost:4173', { waitUntil: 'networkidle' })
  await m.waitForTimeout(900)
  await m.evaluate(() => window.scrollTo(0, 0))
  await m.waitForTimeout(100)
  const mBox = await m.locator('#inicio').boundingBox()
  const mShot = await m.screenshot()
  const mp = decodePng(mShot)
  const cx = Math.round(mBox.x + mBox.width * 0.5)
  const cy = Math.round(mBox.y + mBox.height * 0.5)
  const mCenter = cy >= 0 && cy < mp.height && cx >= 0 && cx < mp.width
    ? [
        mp.data[(cy * mp.width + cx) * mp.bpp],
        mp.data[(cy * mp.width + cx) * mp.bpp + 1],
        mp.data[(cy * mp.width + cx) * mp.bpp + 2],
      ]
    : [255, 255, 255]
  lum(mCenter) > 238 ? ok(`${w}px: mobile centro claro (${hex(mCenter)})`) : fail(`${w}px: mobile centro ${hex(mCenter)}`)
  const mOverflow = await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  mOverflow ? ok(`${w}px: sem overflow`) : fail(`${w}px: overflow`)
  await m.close()
}

await browser.close()
console.log(log.join('\n'))
