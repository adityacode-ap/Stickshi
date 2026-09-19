import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import { products as fallbackProducts, formatINR, shippingFee, freeShippingAbove, codFee } from './Javascripts/data.js'
import { useCart } from './Javascripts/useCart.js'
import { api } from './Javascripts/api.js'
import { CartIcon, MoonIcon, Star, SunIcon } from './ui.jsx'
import Home from './Home.jsx'
import Admin from './Admin.jsx'
import Dev from './Dev.jsx'
import CustomOrder from './CustomOrder.jsx'
import { About, Contact, Report, Sidebar, Team, WhatsAppFloat } from './pages.jsx'
import AuthPanel from './Auth.jsx'

function Header({ count, onCart, onHome, onAdmin, onDev, user, onSignOut, onOpenAuth, theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <div className="navbar-spacer" />
        <button className="logo" onClick={onHome}>Stickshi</button>

        <div className="nav-right">
          {user ? (
            <div className="user-menu">
              <span className="user-name" title={user.email || user.phone}>{user.name}</span>
              <button className="btn ghost" onClick={onSignOut}>Sign Out</button>
            </div>
          ) : (
            <button className="btn ghost sign-in-btn" onClick={onOpenAuth}>Sign In</button>
          )}
          <button className="theme-toggle" aria-label="Toggle dark mode" onClick={onToggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="cart-button" aria-label="Shopping cart" onClick={onCart}>
            <CartIcon />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
        </div>
      </nav>
      <p className="tagline">by Limshin · delivering across India 🇮🇳 · <button className="link" onClick={onAdmin}>Admin</button> · <button className="link dev-link" onClick={onDev}>Dev</button></p>
    </header>
  )
}

function ProductDetails({ product, onBack, onAdd }) {
  const [qty, setQty] = useState(1)
  const [stickerName, setStickerName] = useState('')
  const [description, setDescription] = useState('')
  const isCustom = product.category === 'Custom'
  const customOk = !isCustom || (stickerName.trim() && description.trim())
  return (
    <main className="details">
      <button className="back" onClick={onBack}>← Back</button>
      <div className="detail-card">
        <div className="detail-art" style={{ background: product.bg }}>{product.image ? <img src={product.image} alt={product.name} className="detail-img" /> : product.emoji}</div>
        <div className="detail-body">
          <span className="cat">{product.category}</span>
          <h1>{product.name}</h1>
          <p>{product.desc}</p>
          {isCustom && (
            <div className="custom-fields">
              <label>Sticker name
                <input placeholder="e.g. My GTR Killingit" value={stickerName} onChange={(e) => setStickerName(e.target.value)} maxLength={60} required />
              </label>
              <label>Describe your design
                <textarea placeholder="Your idea, art, photo or logo — colors, size, style. Anything that helps us nail it." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} required />
              </label>
              <p className="custom-note">🎨 Price covers one custom die-cut sticker. Tell us your design, then pay &amp; place the order via UPI or PayPal.</p>
            </div>
          )}
          <span className="rating big"><Star />{product.rating}</span>
          <p className="price big">{formatINR(product.price)}</p>
          <div className="qty-row">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="increase">+</button>
          </div>
          <button className="btn add wide" disabled={!customOk} onClick={() => { onAdd(product.id, qty, isCustom ? { name: stickerName.trim(), description: description.trim() } : undefined); onBack() }}>
            {isCustom && !customOk ? 'Add name & design' : `Add ${qty} to Cart`}
          </button>
        </div>
      </div>
    </main>
  )
}

function Cart({ items, setQty, remove, onCheckout, onContinue }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = items.length && subtotal >= freeShippingAbove ? 0 : items.length ? shippingFee : 0
  if (!items.length)
    return (
      <main className="center">
        <p className="big-emoji">🛒</p>
        <h2>Your cart is empty</h2>
        <button className="btn add" onClick={onContinue}>Start shopping</button>
      </main>
    )
  return (
    <main className="cart">
      <button className="back" onClick={onContinue}>← Continue shopping</button>
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map((i) => (
            <div className="cart-item" key={i.id + (i.customData ? JSON.stringify(i.customData) : '')} style={{ background: i.bg }}>
              <span className="mini-art">{i.emoji}</span>
              <div className="ci-body">
                <h3>{i.name}</h3>
                {i.customData && <p className="custom-detail">🎨 <b>{i.customData.name}</b> — {i.customData.description}</p>}
                <span className="price">{formatINR(i.price)}</span>
                <div className="qty-row">
                  <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                </div>
              </div>
              <div className="ci-right">
                <b>{formatINR(i.price * i.qty)}</b>
                <button className="remove" onClick={() => remove(i.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <aside className="summary">
          <h3>Order Summary</h3>
          <p><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
          <p><span>Shipping</span><span>{shipping ? formatINR(shipping) : 'FREE'}</span></p>
          <p className="total"><span>Total</span><span>{formatINR(subtotal + shipping)}</span></p>
          <button className="btn add wide" onClick={onCheckout}>Checkout</button>
        </aside>
      </div>
    </main>
  )
}

function cartWithData(cart, items) {
  return cart.map((i) => {
    const p = items.find((x) => x.id === i.id)
    return p ? { ...i, ...p } : { ...i, name: '—', price: 0, emoji: '🫧', bg: '#eee' }
  })
}

function Checkout({ cart, products, onPlaceOrder, onBack }) {
  const items = cartWithData(cart, products)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' })
  const [pay, setPay] = useState('UPI')
  const [placing, setPlacing] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const hasCustom = items.some((i) => i.customData)
  const payOptions = hasCustom ? ['UPI', 'PayPal'] : ['UPI', 'Card', 'COD']

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal >= freeShippingAbove ? 0 : shippingFee
  const cod = pay === 'COD' ? codFee : 0
  const total = subtotal + shipping + cod

  const valid =
    form.name && form.email.includes('@') && /^\d{10}$/.test(form.phone) && form.address &&
    form.city && form.state && /^\d{6}$/.test(form.pincode)

  return (
    <main className="checkout">
      <button className="back" onClick={onBack}>← Back to cart</button>
      <h1>Checkout</h1>
      <div className="cart-layout">
        <section className="form">
          <h3>Delivery Details</h3>
          <input placeholder="Full name" value={form.name} onChange={set('name')} />
          <input placeholder="Email" type="email" value={form.email} onChange={set('email')} />
          <input placeholder="Phone (10 digits)" value={form.phone} onChange={set('phone')} />
          <textarea placeholder="Address (house no, street, area)" value={form.address} onChange={set('address')} />
          <div className="row2">
            <input placeholder="City" value={form.city} onChange={set('city')} />
            <input placeholder="State" value={form.state} onChange={set('state')} />
          </div>
          <input placeholder="Pincode (6 digits)" value={form.pincode} onChange={set('pincode')} />
          <h3>Payment Method</h3>
          {hasCustom && <p className="custom-note">🎨 Custom stickers are made to order — pay upfront via UPI or PayPal to place this order (no COD).</p>}
          <div className="pay-options">
            {payOptions.map((m) => (
              <button key={m} className={`chip ${pay === m ? 'active' : ''}`} onClick={() => setPay(m)}>{m}</button>
            ))}
          </div>
        </section>
        <aside className="summary">
          <h3>Order Summary</h3>
          {items.map((i) => (
            <p key={i.id} className="line"><span>{i.name} × {i.qty}</span><span>{formatINR(i.price * i.qty)}</span></p>
          ))}
          <hr />
          <p><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
          <p><span>Shipping</span><span>{shipping ? formatINR(shipping) : 'FREE'}</span></p>
          {cod > 0 && <p><span>COD fee</span><span>{formatINR(cod)}</span></p>}
          <p className="total"><span>Total</span><span>{formatINR(total)}</span></p>
          <button
            className="btn add wide"
            disabled={!valid || placing}
            onClick={async () => {
              setPlacing(true)
              try {
                await onPlaceOrder({ ...form, pay, total, count: items.length })
              } catch {
                setPlacing(false)
              }
            }}
          >
            {!valid ? 'Fill all details' : placing ? 'Placing order…' : `Pay ${formatINR(total)}`}
          </button>
        </aside>
      </div>
    </main>
  )
}

function Success({ order, onHome }) {
  return (
    <main className="center">
      <p className="big-emoji">🎉</p>
      <h2>Order placed!</h2>
      <p>Order ID: <b>STK{order.id}</b></p>
      <p>Delivering {order.count} {order.count === 1 ? 'item' : 'items'} to {order.name}, {order.city} · {order.pincode}</p>
      <p className="total">Total: {formatINR(order.total)} via {order.pay}</p>
      <button className="btn add" onClick={onHome}>Back to shop</button>
    </main>
  )
}

function App() {
  const cart = useCart()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [view, setView] = useState({ name: 'home' })
  const [user, setUser] = useState(null)
  const [userToken, setUserToken] = useState(() => localStorage.getItem('stickshi-user') || '')
  const [showAuth, setShowAuth] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('stickshi-theme') || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('stickshi-theme', theme)
  }, [theme])

  useEffect(() => {
    api('/products')
      .then((d) => setProducts(d.products))
      .catch(() => setProducts(fallbackProducts))
  }, [])

  useEffect(() => {
    if (!userToken) return
    api('/auth/me', { token: userToken })
      .then((d) => setUser(d.user))
      .catch(() => { setUserToken(''); localStorage.removeItem('stickshi-user') })
  }, [userToken])

  const go = (v) => { setView(v); navigate('/'); window.scrollTo(0, 0) }
  const items = useMemo(() => cartWithData(cart.items, products), [cart.items, products])
  const onAdd = (id, qty = 1, customData) => { cart.add(id, qty, customData) }

  const login = (token, info) => { setUserToken(token); setUser(info) }
  const logout = () => {
    if (userToken) api('/auth/logout', { method: 'POST', token: userToken }).catch(() => {})
    setUserToken(''); setUser(null)
  }

  const customProduct = products.find((p) => p.category === 'Custom')

  const store = view.name === 'admin'
    ? <Admin onExit={() => go({ name: 'home' })} onUpdateProducts={setProducts} />
    : view.name === 'dev'
      ? <Dev onExit={() => go({ name: 'home' })} onOpenAdmin={() => go({ name: 'admin' })} />
      : view.name === 'custom'
        ? <CustomOrder product={customProduct} onBack={() => go({ name: 'home' })} onDone={(o) => go({ name: 'success', order: o })} />
        : view.name === 'product'
    ? <ProductDetails product={view.product} onBack={() => go({ name: 'home' })} onAdd={onAdd} />
    : view.name === 'cart'
      ? <Cart items={items} setQty={cart.setQty} remove={cart.remove} onCheckout={() => go({ name: 'checkout' })} onContinue={() => go({ name: 'home' })} />
      : view.name === 'checkout'
        ? <Checkout cart={cart.items} products={products} onBack={() => go({ name: 'cart' })} onPlaceOrder={async (o) => {
            try {
              const saved = await api('/orders', { method: 'POST', body: { ...o, items: items.map((i) => ({ name: i.name, emoji: i.emoji, qty: i.qty, price: i.price, category: i.category, customData: i.customData })) } })
              o.id = saved.id
            } catch {
              // order still shown locally if backend is unreachable
            }
            cart.clear()
            go({ name: 'success', order: o })
          }} />
        : view.name === 'success'
          ? <Success order={view.order} onHome={() => go({ name: 'home' })} />
          : <Home products={products} onOpen={(p) => go({ name: 'product', product: p })} onAdd={onAdd} userToken={userToken} onOpenAuth={() => setShowAuth(true)} onCreateCustom={() => go({ name: 'custom' })} />

  return (
    <div className="app">
      <Header count={cart.count} onCart={() => go({ name: 'cart' })} onHome={() => go({ name: 'home' })} onAdmin={() => go({ name: 'admin' })} onDev={() => go({ name: 'dev' })} user={user} onSignOut={logout} onOpenAuth={() => setShowAuth(true)} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
      <div className="layout">
        <Sidebar />
        <Routes>
          <Route path="/about" element={<div className="content"><About /></div>} />
          <Route path="/contact" element={<div className="content"><Contact /></div>} />
          <Route path="/team" element={<div className="content"><Team /></div>} />
          <Route path="/report" element={<div className="content"><Report /></div>} />
          <Route path="/" element={<div className="content">{store}</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <WhatsAppFloat />
      <CookieConsent loggedIn={!!user} />
      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} onAuth={login} />}
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  const go = (path) => { navigate(path); window.scrollTo(0, 0) }
  return (
    <div className="content">
      <section className="notfound">
        <div className="nf-sticker" aria-hidden="true">
          <div className="nf-tape nf-tape-1" />
          <div className="nf-tape nf-tape-2" />
          <div className="nf-num">4</div>
          <div className="nf-num hl nf-rip">0</div>
          <div className="nf-num">4</div>
        </div>
        <p className="nf-kicker">ERROR 404</p>
        <h1 className="nf-title">This sticker got lost in the mail.</h1>
        <p className="nf-sub">The page you're after doesn't exist — but there are plenty of stickers that do.</p>
        <div className="nf-actions">
          <button className="btn add" onClick={() => go('/')}>Back to the shop</button>
          <button className="btn ghost" onClick={() => go('/about')}>About Stickshi</button>
        </div>
      </section>
      <div className="nf-ghost" aria-hidden="true">LOST&nbsp;&nbsp;IN&nbsp;&nbsp;TRANSIT&nbsp;&nbsp;·&nbsp;&nbsp;LOST&nbsp;&nbsp;IN&nbsp;&nbsp;TRANSIT&nbsp;&nbsp;·&nbsp;&nbsp;</div>
    </div>
  )
}

function CookieConsent({ loggedIn }) {
  const [state, setState] = useState(() => (loggedIn && localStorage.getItem('stickshi-cookies') ? 'done' : 'ask'))
  const [thanks, setThanks] = useState(false)
  const eat = (kind) => {
    if (loggedIn) localStorage.setItem('stickshi-cookies', kind)
    setThanks(true)
  }
  useEffect(() => {
    if (!thanks) return undefined
    const t = setTimeout(() => setState('done'), 4200)
    return () => clearTimeout(t)
  }, [thanks])
  if (state === 'done') return null
  return (
    <div className="cookie-bar" role="dialog" aria-label="Cookie consent">
      {thanks ? (
        <p className="cookie-thanks">Thank you for accepting cookies. My grandfather loves you <span className="cookie-heart" aria-hidden="true">❤</span></p>
      ) : (
        <>
          <div className="cookie-text">
            <strong className="cookie-title">Cookies for the road? <span className="cookie-heart" aria-hidden="true">❤</span></strong>
            <p>In loving memory of my grandpa, this little shop uses cookies to remember your cart and keep things smooth. Choose how many you'd like to munch.</p>
          </div>
          <div className="cookie-actions">
            <button className="btn add" onClick={() => eat('all')}>EAT ALL</button>
            <button className="btn ghost" onClick={() => eat('some')}>EAT SOME</button>
          </div>
        </>
      )}
    </div>
  )
}

export default App