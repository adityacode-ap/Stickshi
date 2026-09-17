import { useCallback, useEffect, useState } from 'react'
import { categories, formatINR } from './data.js'
import { api } from './api.js'

const TOKEN_KEY = 'stickshi-admin'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const d = await api('/login', { method: 'POST', body: { email, password: pass } })
      sessionStorage.setItem(TOKEN_KEY, d.token)
      onLogin(d.token)
    } catch (err) {
      setErr(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="center admin-login">
      <h1>Welcome Back Boss</h1>
      <p className="cat">LIMSHIN-MUSIC ARTIST</p>
      <form className="admin-login-form" onSubmit={submit}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn add" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

function ProductsTab({ token, onUnauthorized, onUpdated }) {
  const [products, setProducts] = useState([])
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleError = useCallback((e) => {
    if (e.status === 401) onUnauthorized()
    else setErr('Could not load products. Is the server running?')
  }, [onUnauthorized])

  useEffect(() => {
    api('/products', { token })
      .then((d) => { setProducts(d.products); setErr('') })
      .catch(handleError)
  }, [token, handleError])

  const apply = async (req, done) => {
    setBusy(true)
    try {
      const d = await req
      setProducts(d.products)
      setErr('')
      onUpdated(d.products)
    } catch (e) {
      if (e.status === 401) onUnauthorized()
      else alert(e.message)
    } finally {
      setBusy(false)
      done?.()
    }
  }

  const save = () => apply(api(`/products/${editing}`, { method: 'PUT', body: { ...draft, price: +draft.price || 0 }, token }), () => setEditing(null))

  const addProduct = () => {
    const p = {
      id: Math.max(0, ...products.map((x) => x.id)) + 1,
      name: draft.name || 'New Sticker',
      category: draft.category || 'Anime',
      price: +draft.price || 49,
      emoji: draft.emoji || '🫧',
      bg: draft.bg || '#e8ecf0',
      desc: draft.desc || '',
      rating: 4.5,
    }
    apply(api('/products', { method: 'POST', body: p, token }), () => { setAdding(false); setDraft({}) })
  }

  const remove = (id) => apply(api(`/products/${id}`, { method: 'DELETE', token }))

  const fields = (p) => (
    <>
      <input value={draft.name ?? p.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" />
      <input value={draft.price ?? p.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Price ₹" />
      <input value={draft.emoji ?? p.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} placeholder="Emoji" />
      <select value={draft.category ?? p.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
        {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
      </select>
    </>
  )

  return (
    <div className="admin-products">
      <div className="admin-head">
        <h2>Products ({products.length})</h2>
        <button className="btn add" onClick={() => { setAdding(true); setDraft({}) }}>+ Add</button>
      </div>
      {err && <p className="err">{err}</p>}
      {adding && (
        <div className="admin-row admin-add">
          {fields({ name: '', price: '', emoji: '', category: 'Anime' })}
          <button className="btn add" disabled={busy} onClick={addProduct}>Save</button>
          <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      <div className="admin-table">
        <div className="admin-th"><span>Product</span><span>Category</span><span>Price</span><span>Actions</span></div>
        {products.map((p) => (
          <div className="admin-row" key={p.id}>
            {editing === p.id ? fields(p) : (
              <>
                <span>{p.emoji} {p.name}</span>
                <span>{p.category}</span>
                <span>{formatINR(p.price)}</span>
              </>
            )}
            <span className="admin-actions">
              {editing === p.id ? (
                <>
                  <button className="btn add" disabled={busy} onClick={save}>Save</button>
                  <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => { setEditing(p.id); setDraft({}) }}>Edit</button>
                  <button className="btn danger" onClick={() => remove(p.id)}>Delete</button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrdersTab({ token, onUnauthorized }) {
  const [orders, setOrders] = useState([])
  const [err, setErr] = useState('')

  const handleError = useCallback((e) => {
    if (e.status === 401) onUnauthorized()
    else setErr('Could not load orders. Is the server running?')
  }, [onUnauthorized])

  useEffect(() => {
    api('/orders', { token })
      .then((d) => { setOrders(d.orders); setErr('') })
      .catch(handleError)
  }, [token, handleError])

  return (
    <div className="admin-orders">
      <h2>Orders ({orders.length})</h2>
      {err && <p className="err">{err}</p>}
      {orders.length === 0 && !err && <p className="empty">No orders yet.</p>}
      <div className="admin-table">
        {orders.map((o, i) => (
          <div className="admin-order" key={i}>
            <p><b>#{o.id}</b> · {new Date(o.placedAt).toLocaleString('en-IN')} · {o.pay}</p>
            <p><b>{o.name}</b> · {o.phone} · {o.address}, {o.city}, {o.state} {o.pincode}</p>
            <p>{o.items ? o.items.map((it) => `${it.emoji} ${it.name} ×${it.qty}`).join(', ') : `${o.count} items`} · <b>{formatINR(o.total)}</b></p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentsTab({ token, onUnauthorized }) {
  const [comments, setComments] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const handleError = useCallback((e) => {
    if (e.status === 401) onUnauthorized()
    else setErr('Could not load comments. Is the server running?')
  }, [onUnauthorized])

  useEffect(() => {
    api('/admin/comments', { token })
      .then((d) => { setComments(d.comments); setErr('') })
      .catch(handleError)
  }, [token, handleError])

  const act = async (fn, done) => {
    setBusy(true)
    try {
      await fn
    } catch (e) {
      if (e.status === 401) onUnauthorized()
      else alert(e.message)
    } finally {
      setBusy(false)
      done?.()
    }
  }

  const toggleHighlight = async (id) => {
    const d = await api(`/comments/${id}`, { method: 'PATCH', token })
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, highlighted: d.highlighted } : c)))
  }

  const remove = async (id) => {
    await api(`/comments/${id}`, { method: 'DELETE', token })
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="admin-comments">
      <h2>Comments ({comments.length})</h2>
      {err && <p className="err">{err}</p>}
      {comments.length === 0 && !err && <p className="empty">No comments yet.</p>}
      <div className="admin-table">
        {comments.map((c) => (
          <div className={`admin-row comment-admin${c.highlighted ? ' featured' : ''}`} key={c.id}>
            <span className="comment-text">{c.highlighted && <span className="hl-badge">★</span>} <b>{c.name}</b>: {c.text}</span>
            <span className="admin-actions">
              <button className="btn" disabled={busy} onClick={() => act(toggleHighlight(c.id))}>
                {c.highlighted ? 'Unhighlight' : 'Highlight'}
              </button>
              <button className="btn danger" disabled={busy} onClick={() => act(remove(c.id))}>Remove</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin({ onExit, onUpdateProducts }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('products')

  const logout = useCallback(() => {
    const t = sessionStorage.getItem(TOKEN_KEY)
    if (t) api('/logout', { method: 'POST', token: t }).catch(() => {})
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setAuthed(false)
  }, [])

  useEffect(() => {
    if (!token) return
    api('/me', { token })
      .then(() => setAuthed(true))
      .catch(() => logout())
  }, [token, logout])

  return (
    <main className="admin">
      {authed ? (
        <>
          <div className="admin-bar">
            <button className="btn" onClick={onExit}>← Store</button>
            <h1>Admin</h1>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
          <div className="chips admin-tabs">
            <button className={`chip ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
            <button className={`chip ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            <button className={`chip ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>Comments</button>
          </div>
          {tab === 'products'
            ? <ProductsTab token={token} onUpdated={onUpdateProducts} onUnauthorized={logout} />
            : tab === 'orders'
              ? <OrdersTab token={token} onUnauthorized={logout} />
              : <CommentsTab token={token} onUnauthorized={logout} />}
        </>
      ) : (
        <Login onLogin={(t) => { setToken(t); setAuthed(true) }} />
      )}
      <footer className="Msg1">
        "Message by The developer-Hii,I love you bro!"
      </footer>
    </main>
  )
}