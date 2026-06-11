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
const crypto = require('crypto')
const Razorpay = require('razorpay')
const admin = require('firebase-admin')

// Initialize Firebase Admin safely
let db = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("✅ Firebase Admin initialized securely");
  } catch (e) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64");
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 missing. Subscription upgrades will fail.");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

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

// ─── AI Proxy Endpoint (OpenRouter) ──────────────────────────────────────────

app.post('/api/ai/chat', async (req, res) => {
  try {
    const OR_KEY = process.env.VITE_OR_KEY || process.env.OR_KEY;
    if (!OR_KEY) {
      return res.status(500).json({ error: "OpenRouter API Key not configured on server" });
    }

    // We use the modern fetch API available in Node.js 18+
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OR_KEY}`,
        'HTTP-Referer': 'https://mysmartgains.app', // Required by OpenRouter
        'X-Title': 'MSG - My Smart Gains', // Required by OpenRouter
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `OpenRouter error ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("AI Proxy Error:", err);
    res.status(500).json({ error: 'Failed to communicate with AI provider' });
  }
});

// ─── Razorpay Secure Endpoints ───────────────────────────────────────────────

app.post('/api/create-order', async (req, res) => {
  try {
    const { plan, gymId } = req.body;
    // Hardcode pricing on server to prevent spoofing
    let amount = 0;
    if (plan === 'monthly') amount = 49900; // ₹499 in paise
    else if (plan === 'yearly') amount = 419900; // ₹4199 in paise
    else return res.status(400).json({ error: 'Invalid plan' });

    const options = {
      amount, 
      currency: "INR",
      receipt: `receipt_${gymId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, plan } = req.body;
    
    // Cryptographically verify the signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(text.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature. Spoofing detected." });
    }

    if (!db) {
      return res.status(500).json({ error: "Firebase Admin DB not configured on server" });
    }

    // Signature is valid. Upgrade the user's plan in Firestore securely!
    const now = Date.now();
    const expiresAt = plan === 'yearly' ? now + 365 * 86400000 : now + 30 * 86400000;
    
    await db.collection("users").doc(uid).set({
      subscription: {
        status: 'active',
        plan: plan,
        activatedAt: now,
        expiresAt: expiresAt,
        earlyAdopter: true
      }
    }, { merge: true });

    res.json({ success: true, message: "Payment verified and subscription activated securely." });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ MSG API proxy running on http://localhost:${PORT}`)
  console.log(`   Forward requests from the app to this proxy.`)
})
