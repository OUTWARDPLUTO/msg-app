// server.js — Local API proxy (Node.js + Express)
// Run this on your server to keep your Anthropic API key hidden from the client.
// The MSG app calls /api/chat instead of api.anthropic.com directly.
//
// Usage:
//   npm install express cors
//   ANTHROPIC_API_KEY=sk-ant-... node server.js

const express = require('express')
const cors = require('cors')
const https = require('https')

const app = express()
const PORT = process.env.PORT || 4000
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required')
  process.exit(1)
}

app.use(cors({
  origin: ['http://localhost:3000', 'https://mysmartgains.app', /\.vercel\.app$/]
}))
app.use(express.json({ limit: '1mb' }))

app.post('/api/chat', (req, res) => {
  const body = JSON.stringify({
    model: req.body.model || 'claude-sonnet-4-20250514',
    max_tokens: req.body.max_tokens || 1000,
    system: req.body.system,
    messages: req.body.messages
  })

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  }

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' })
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err)
    res.status(500).json({ error: 'Upstream error' })
  })

  proxyReq.write(body)
  proxyReq.end()
})

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'MSG API Proxy' }))

app.listen(PORT, () => {
  console.log(`✅ MSG API proxy running on http://localhost:${PORT}`)
  console.log(`   Forward requests from the app to this proxy.`)
})
