import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getAdmin, getComments, getOrders, getProducts, getUsers, saveComments, saveOrder, saveProducts, saveUsers } from './db.js'
import { createToken, hashPassword, verifyPassword } from './auth.js'

try { process.loadEnvFile() } catch { void 0 }

const dir = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

const adminSessions = new Map()
const userSessions = new Map()
const attempts = new Map()
const MAX_ATTEMPTS = 3
const LOCK_MS = 15 * 60 * 1000
const TOKEN_TTL = 24 * 60 * 60 * 1000
const now = () => Date.now()

function minsLeft(key) {
  const a = attempts.get(key)
  return a?.until ? Math.max(1, Math.ceil((a.until - now()) / 60000)) : 0
}

function recordFail(key) {
  const a = attempts.get(key) || { count: 0 }
  a.count += 1
  if (a.count >= MAX_ATTEMPTS) {
    a.count = 0
    a.until = now() + LOCK_MS
  }
  attempts.set(key, a)
}

function isLocked(key) {
  const a = attempts.get(key)
  if (!a?.until) return false
  if (now() >= a.until) {
    attempts.delete(key)
    return false
  }
  return true
}


const buckets = new Map()
const BUCKET_CLEANUP_MS = 5 * 60 * 1000

function clientIp(req) {
  const fw = req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || req.socket?.remoteAddress
  return String(fw).split(',')[0].trim() || 'unknown'
}

function rateLimit({ key, windowMs = 60 * 1000, limit = 10, message }) {
  return (req, res, next) => {
    const k = `${typeof key === 'function' ? key(req) : key}:${clientIp(req)}`
    const t = Date.now()
    const b = buckets.get(k)
    if (!b || b.reset <= t) {
      buckets.set(k, { count: 1, reset: t + windowMs })
      return next()
    }
    b.count += 1
    if (b.count > limit) {
      res.set('Retry-After', String(Math.ceil((b.reset - t) / 1000)))
      return res.status(429).json({ error: message || 'Too many requests. Try again in a minute.' })
    }
    next()
  }
}

setInterval(() => {
  const t = Date.now()
  for (const [k, b] of buckets) if (b.reset <= t) buckets.delete(k)
}, BUCKET_CLEANUP_MS)

app.post('/api/login', rateLimit({ key: 'admin-login', limit: 10, message: 'Too many sign-in attempts. Try again in a minute.' }), (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const admin = getAdmin()
  if (isLocked(email)) return res.status(429).json({ error: `Too many failed attempts. Locked for ${minsLeft(email)} min` })
  if (email !== admin.email || !verifyPassword(password, admin.salt, admin.hash)) {
    recordFail(email)
    const msg = isLocked(email)
      ? `Too many failed attempts. Locked for ${minsLeft(email)} min`
      : 'Invalid email or password'
    return res.status(401).json({ error: msg })
  }
  attempts.delete(email)
  const token = createToken()
  adminSessions.set(token, { email, until: now() + TOKEN_TTL })
  res.json({ token, email: admin.email })
})

function adminAuth(req, res, next) {
  const token = tokenFrom(req)
  const s = adminSessions.get(token)
  if (!s || s.until < now()) {
    adminSessions.delete(token)
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.admin = s
  req.token = token
  next()
}

app.post('/api/logout', adminAuth, (req, res) => {
  adminSessions.delete(req.token)
  res.json({ ok: true })
})

app.get('/api/me', adminAuth, (req, res) => res.json({ email: req.admin.email }))

function userAuth(req, res, next) {
  const token = tokenFrom(req)
  const s = userSessions.get(token)
  if (!s || s.until < now()) {
    userSessions.delete(token)
    return res.status(401).json({ error: 'Please sign in' })
  }
  req.user = s
  req.userToken = token
  next()
}


const tokenFrom = (req) => (req.headers.authorization || '').replace(/^Bearer /, '')

function identity(req) {
  const token = tokenFrom(req)
  const admin = adminSessions.get(token)
  const user = userSessions.get(token)
  return {
    token,
    isAdmin: !!(admin && admin.until >= now()),
    isUser: !!(user && user.until >= now()),
    userId: user?.userId ?? null,
  }
}

function optionalUser(req, res, next) {
  const token = tokenFrom(req)
  const s = userSessions.get(token)
  if (s && s.until >= now()) {
    req.user = s
    req.userToken = token
  }
  next()
}

function ownerOrAdmin(req, res, next) {
  const me = identity(req)
  const row = req.policyRow
  if (me.isAdmin || (me.isUser && row && me.userId === row.userId)) return next()
  return res.status(403).json({ error: 'You are not allowed to do that' })
}

const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email })


app.post('/api/auth/signup', rateLimit({ key: 'signup', windowMs: 60 * 60 * 1000, limit: 5, message: 'Too many accounts from this address. Try again later.' }), (req, res) => {
  const { name, phone, password } = req.body || {}
  if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone and password are required' })
  if (!/^\d{10}$/.test(String(phone))) return res.status(400).json({ error: 'Phone number must be 10 digits' })
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const users = getUsers()
  if (users.some((u) => u.phone === String(phone))) return res.status(409).json({ error: 'Phone number already registered' })
  const user = {
    id: Date.now(),
    name: String(name).trim(),
    phone: String(phone),
    ...hashPassword(String(password)),
    authMethod: 'phone',
    createdAt: new Date().toISOString(),
  }
  saveUsers([...users, user])
  const token = createToken()
  userSessions.set(token, { userId: user.id, name: user.name, phone: user.phone, until: now() + TOKEN_TTL })
  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/login', rateLimit({ key: 'user-login', limit: 10, message: 'Too many sign-in attempts. Try again in a minute.' }), (req, res) => {
  const { phone, password } = req.body || {}
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' })
  const key = `user:${phone}`
  if (isLocked(key)) return res.status(429).json({ error: `Too many failed attempts. Locked for ${minsLeft(key)} min` })
  const user = getUsers().find((u) => u.phone === String(phone))
  if (!user || user.authMethod !== 'phone' || !verifyPassword(String(password), user.salt, user.hash)) {
    recordFail(key)
    const msg = isLocked(key)
      ? `Too many failed attempts. Locked for ${minsLeft(key)} min`
      : 'Invalid phone number or password'
    return res.status(401).json({ error: msg })
  }
  attempts.delete(key)
  const token = createToken()
  userSessions.set(token, { userId: user.id, name: user.name, phone: user.phone, until: now() + TOKEN_TTL })
  res.json({ token, user: publicUser(user) })
})

app.get('/api/auth/me', userAuth, (req, res) => res.json({ user: { id: req.user.userId, name: req.user.name, phone: req.user.phone, email: req.user.email } }))

app.post('/api/auth/logout', userAuth, (req, res) => {
  userSessions.delete(req.userToken)
  res.json({ ok: true })
})


async function verifyGoogleCredential(credential) {
  const [headerB64, payloadB64, signatureB64] = String(credential).split('.')
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid Google credential')

  const header = JSON.parse(Buffer.from(headerB64, 'base64url'))
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url'))

  if (header.alg !== 'RS256') throw new Error('Unsupported algorithm')
  if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error('Google session expired')
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (clientId && payload.aud !== clientId) throw new Error('Invalid audience')

  const { keys } = await new Promise((resolve, reject) => {
    https.get('https://www.googleapis.com/oauth2/v3/certs', (r) => {
      let data = ''
      r.on('data', (c) => { data += c })
      r.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { reject(new Error('Failed to fetch Google keys')) }
      })
    }).on('error', reject)
  })

  const key = keys.find((k) => k.kid === header.kid)
  if (!key) throw new Error('Unknown Google signing key')

  const publicKey = crypto.createPublicKey({ key, format: 'jwk' })
  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(`${headerB64}.${payloadB64}`)
  if (!verifier.verify(publicKey, Buffer.from(signatureB64, 'base64url'))) throw new Error('Invalid Google signature')

  return payload
}

app.post('/api/auth/google', rateLimit({ key: 'google-auth', limit: 10, message: 'Too many attempts. Try again in a minute.' }), async (req, res) => {
  const { credential } = req.body || {}
  if (!credential) return res.status(400).json({ error: 'Google credential required' })
  try {
    const payload = await verifyGoogleCredential(credential)
    const googleId = String(payload.sub)
    const email = payload.email
    const name = payload.name || (email ? email.split('@')[0] : 'Google User')
    const users = getUsers()
    let user = users.find((u) => u.googleId === googleId) || (email && users.find((u) => u.email === email))
    if (!user) {
      user = {
        id: Date.now(),
        name,
        email,
        googleId,
        authMethod: 'google',
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      saveUsers(users)
    }
    const token = createToken()
    userSessions.set(token, { userId: user.id, name: user.name, email: user.email, until: now() + TOKEN_TTL })
    res.json({ token, user: publicUser(user) })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})


function sendOtp(phone, otp) {
  if (process.env.SMS_PROVIDER) return
  console.log(`[dev] OTP for ${phone}: ${otp}`)
}

app.post('/api/auth/reset-request',
  rateLimit({ key: 'reset-request', limit: 5, message: 'Too many OTP requests. Try again in a minute.' }),
  rateLimit({ key: (req) => `reset-phone:${req.body?.phone}`, windowMs: 10 * 60 * 1000, limit: 1, message: 'OTP already sent. Check your phone or wait 10 minutes.' }),
  (req, res) => {
  const { phone } = req.body || {}
  if (!phone) return res.status(400).json({ error: 'Phone number required' })
  const users = getUsers()
  const user = users.find((u) => u.phone === String(phone) && u.authMethod === 'phone')
  if (!user) return res.status(404).json({ error: 'No account found with this phone number' })
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  user.otp = otp
  user.otpExpiry = now() + 10 * 60 * 1000
  saveUsers(users)
  sendOtp(user.phone, otp)
  res.json({ message: 'OTP sent to your phone', dev: !process.env.SMS_PROVIDER && otp })
})

app.post('/api/auth/reset-confirm', rateLimit({ key: (req) => `reset-confirm:${req.body?.phone}`, windowMs: 10 * 60 * 1000, limit: 5, message: 'Too many reset attempts. Wait 10 minutes.' }), (req, res) => {
  const { phone, otp, newPassword } = req.body || {}
  if (!phone || !otp || !newPassword) return res.status(400).json({ error: 'Phone, OTP and new password are required' })
  if (String(newPassword).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const users = getUsers()
  const user = users.find((u) => u.phone === String(phone) && u.authMethod === 'phone')
  if (!user) return res.status(404).json({ error: 'No account found' })
  if (!user.otp || String(user.otp) !== String(otp) || !user.otpExpiry || user.otpExpiry < now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' })
  }
  Object.assign(user, hashPassword(String(newPassword)))
  delete user.otp
  delete user.otpExpiry
  saveUsers(users)
  res.json({ message: 'Password reset successful' })
})


const previewComment = (c) => ({ id: c.id, userId: c.userId, name: c.name, text: c.text, highlighted: c.highlighted, createdAt: c.createdAt })

app.get('/api/comments', (_req, res) => {
  const comments = getComments()
    .filter((c) => !c.removed)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map(previewComment)
  res.json({ comments })
})

app.post('/api/comments', rateLimit({ key: 'comments', limit: 5, message: 'You are commenting too fast. Try again in a minute.' }), userAuth, (req, res) => {
  const text = String(req.body?.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Comment text required' })
  const comment = {
    id: Date.now(),
    userId: req.user.userId,
    name: req.user.name,
    text: text.slice(0, 500),
    highlighted: false,
    removed: false,
    createdAt: new Date().toISOString(),
  }
  saveComments([...getComments(), comment])
  res.json({ comment: previewComment(comment) })
})

app.get('/api/admin/comments', adminAuth, (_req, res) => {
  const comments = getComments().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  res.json({ comments })
})

app.patch('/api/comments/:id', adminAuth, (req, res) => {
  const id = +req.params.id
  const comments = getComments().map((c) => (c.id === id ? { ...c, highlighted: !c.highlighted } : c))
  saveComments(comments)
  res.json({ highlighted: comments.find((c) => c.id === id)?.highlighted ?? false })
})

app.delete('/api/comments/:id', (req, res, next) => {
  const id = +req.params.id
  const comment = getComments().find((c) => c.id === id)
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  req.policyRow = comment
  next()
}, ownerOrAdmin, (req, res) => {
  const id = +req.params.id
  saveComments(getComments().filter((c) => c.id !== id))
  res.json({ ok: true })
})


app.get('/api/products', (_req, res) => res.json({ products: getProducts() }))
app.post('/api/products', adminAuth, (req, res) => {
  saveProducts([...getProducts(), req.body])
  res.json({ products: getProducts() })
})
app.put('/api/products/:id', adminAuth, (req, res) => {
  const id = +req.params.id
  saveProducts(getProducts().map((p) => (p.id === id ? { ...p, ...req.body, id } : p)))
  res.json({ products: getProducts() })
})
app.delete('/api/products/:id', adminAuth, (req, res) => {
  const id = +req.params.id
  saveProducts(getProducts().filter((p) => p.id !== id))
  res.json({ products: getProducts() })
})


app.post('/api/orders', optionalUser, rateLimit({ key: 'orders', limit: 10, message: 'Too many orders. Try again in a minute.' }), (req, res) => {
  const order = { id: Date.now() % 1000000, placedAt: new Date().toISOString(), ...req.body, userId: req.user?.userId ?? null }
  saveOrder(order)
  res.json(order)
})

app.get('/api/orders/me', userAuth, (req, res) => {
  const orders = getOrders().filter((o) => o.userId != null && o.userId === req.user.userId)
  res.json({ orders })
})

app.get('/api/orders', adminAuth, (_req, res) => res.json({ orders: getOrders() }))


app.get('/api/config', (_req, res) => res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' }))


const dist = path.join(dir, '..', 'dist')
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Stickshi server on http://localhost:${PORT}`))
