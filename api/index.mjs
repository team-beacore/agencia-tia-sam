import app from '../server/homolog/app.mjs'

/**
 * Entrypoint serverless da VERCEL (ambiente de HOMOLOGAÇÃO).
 * A Vercel detecta o `app.listen()` e roteia as requisições de `/api/*`
 * para este servidor (configurado no vercel.json).
 *
 * Produção (VPS) continua usando `server/index.js` — este arquivo é
 * usado apenas pela Vercel.
 */

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`[homolog] API server ready on port ${PORT}`)
})

export default app
