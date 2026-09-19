import { useCallback, useEffect, useState } from 'react'
import { api } from './Javascripts/api.js'

const DEV_KEY = 'stickshi-dev'

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
      const d = await api('/dev/login', { method: 'POST', body: { email, password: pass } })
      sessionStorage.setItem(DEV_KEY, d.token)
      onLogin(d.token)
    } catch (err) {
      setErr(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="center admin-login">
      <h1>Developer Panel</h1>
      <p className="cat">Full control · handle with care</p>
      <form className="admin-login-form" onSubmit={submit}>
        <input placeholder="Dev email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Dev password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn add" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

function Overview({ token, onUnauthorized, onOpenAdmin }) {
  const [config, setConfig] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api('/dev/settings', { token })
      .then((d) => { setConfig(d.config); setErr('') })
      .catch((e) => { if (e.status === 401) onUnauthorized(); else setErr('Could not load settings.') })
  }, [token, onUnauthorized])

  useEffect(() => { load() }, [load])

  const set = async (body, label) => {
    setBusy(true)
    try {
      const d = await api('/dev/settings', { method: 'PUT', body, token })
      setConfig(d.config)
      setErr('')
    } catch (e) {
      if (e.status === 401) onUnauthorized()
      else setErr(`Could not toggle ${label}`)
    }
    setBusy(false)
  }

  if (!config) return <p className="empty">Loading…</p>

  return (
    <div className="dev-overview">
      <h2>Quick control</h2>
      {err && <p className="err">{err}</p>}
      <div className="dev-cards">
        <div className={`dev-card${config.siteOpen === false ? ' off' : ''}`}>
          <b>Website {config.siteOpen === false ? 'CLOSED' : 'OPEN'}</b>
          <button className="btn" disabled={busy} onClick={() => set({ siteOpen: config.siteOpen === false }, 'site')}>
            {config.siteOpen === false ? 'Open the shop' : 'Close the shop'}
          </button>
        </div>
        <div className={`dev-card${config.commentsEnabled === false ? ' off' : ''}`}>
          <b>Comments {config.commentsEnabled === false ? 'OFF' : 'ON'}</b>
          <button className="btn" disabled={busy} onClick={() => set({ commentsEnabled: config.commentsEnabled === false }, 'comments')}>
            {config.commentsEnabled === false ? 'Enable comments' : 'Disable comments'}
          </button>
        </div>
        <div className="dev-card">
          <b>Storefront</b>
          <button className="btn add" onClick={onOpenAdmin}>Open Admin Panel</button>
        </div>
      </div>
      <p className="dev-hint">One-click on/off — no code edits needed. Changes apply to the storefront immediately on reload.</p>
    </div>
  )
}

function UsersTab({ token, onUnauthorized }) {
  const [users, setUsers] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [reveal, setReveal] = useState(null)

  const load = useCallback(() => {
    api('/dev/users', { token })
      .then((d) => { setUsers(d.users); setErr('') })
      .catch((e) => { if (e.status === 401) onUnauthorized(); else setErr('Could not load users.') })
  }, [token, onUnauthorized])

  useEffect(() => { load() }, [load])

  const act = async (id, action) => {
    if ((action === 'delete' || action === 'blacklist') && !window.confirm(`Really ${action} this user? This can't be undone.`)) return
    setBusy(true)
    try {
      if (action === 'delete') await api(`/dev/users/${id}`, { method: 'DELETE', token })
      else await api(`/dev/users/${id}/${action}`, { method: 'POST', token })
      load()
    } catch (e) {
      if (e.status === 401) onUnauthorized()
      else alert(e.message)
    }
    setBusy(false)
  }

  return (
    <div className="dev-users">
      <h2>Users ({users.length})</h2>
      <p className="dev-hint">Passwords are stored as one-way scrypt hashes — the original password can never be recovered, only reset. Block = temporary, blacklist = permanent.</p>
      {err && <p className="err">{err}</p>}
      {users.length === 0 && !err && <p className="empty">No users yet.</p>}
      <div className="admin-table">
        <div className="admin-th"><span>User</span><span>Contact</span><span>Status</span><span>Actions</span></div>
        {users.map((u) => (
          <div className="admin-row" key={u.id}>
            <span>
              <b>{u.name}</b>
              <span className="dev-sub">via {u.authMethod}{u.googleId ? ' · Google' : ''}</span>
            </span>
            <span>
              {u.phone || '—'} · {u.email || 'no email'}
              <button className="link dev-sub" onClick={() => setReveal(reveal === u.id ? null : u.id)}>
                {reveal === u.id ? 'hide' : 'show password'}
              </button>
              {reveal === u.id && u.password && (
                <span className="dev-cred">salt: <code>{u.password.salt}</code><br />hash: <code>{u.password.hash}</code></span>
              )}
              {reveal === u.id && !u.password && <span className="dev-cred">No password stored (Google account).</span>}
            </span>
            <span className={`dev-status ${u.status}`}>{u.status}</span>
            <span className="admin-actions">
              <button className="btn" disabled={busy} onClick={() => act(u.id, 'block')}>Block</button>
              <button className="btn" disabled={busy} onClick={() => act(u.id, 'unblock')}>Unblock</button>
              <button className="btn danger" disabled={busy} onClick={() => act(u.id, 'blacklist')}>Blacklist</button>
              <button className="btn danger" disabled={busy} onClick={() => act(u.id, 'delete')}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UiEditor({ token, onUnauthorized }) {
  const [base, setBase] = useState(null)
  const [draft, setDraft] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/dev/settings', { token })
      .then((d) => { setBase(d.config); setDraft(d.config) })
      .catch((e) => { if (e.status === 401) onUnauthorized(); else setErr('Could not load UI settings.') })
  }, [token, onUnauthorized])

  if (!draft) return <p className="empty">Loading…</p>

  const set = (k, v, section = null) => {
    setDraft(section ? { ...draft, [section]: { ...draft[section], [k]: v } } : { ...draft, [k]: v })
  }

  const save = async () => {
    setBusy(true)
    try {
      const d = await api('/dev/settings', {
        method: 'PUT',
        body: { siteOpen: draft.siteOpen, commentsEnabled: draft.commentsEnabled, announcement: draft.announcement, hero: draft.hero, footer: draft.footer },
        token,
      })
      setBase(d.config)
      setErr('')
    } catch (e) {
      if (e.status === 401) onUnauthorized()
      else setErr(e.message)
    }
    setBusy(false)
  }

  const dirty = base && JSON.stringify(base.hero) !== JSON.stringify(draft.hero) ||
    JSON.stringify(base.footer) !== JSON.stringify(draft.footer) ||
    JSON.stringify(base.announcement) !== JSON.stringify(draft.announcement)

  return (
    <div className="dev-ui">
      <div className="admin-head">
        <h2>UI Editor</h2>
        <button className="btn add" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
      {err && <p className="err">{err}</p>}
      <fieldset className="dev-fieldset">
        <legend>Hero</legend>
        <label>Title<input value={draft.hero.title || ''} onChange={(e) => set('title', e.target.value, 'hero')} placeholder="Have Some " /></label>
        <label>Highlighted word<input value={draft.hero.highlight || ''} onChange={(e) => set('highlight', e.target.value, 'hero')} placeholder="STICKSHIsss!" /></label>
        <label>Scheme line<input value={draft.hero.scheme || ''} onChange={(e) => set('scheme', e.target.value, 'hero')} /></label>
        <label>Subtitle<input value={draft.hero.subtitle || ''} onChange={(e) => set('subtitle', e.target.value, 'hero')} /></label>
        <div className="row2">
          <label>Shop button<input value={draft.hero.shopCta || ''} onChange={(e) => set('shopCta', e.target.value, 'hero')} /></label>
          <label>Explore button<input value={draft.hero.exploreCta || ''} onChange={(e) => set('exploreCta', e.target.value, 'hero')} /></label>
        </div>
      </fieldset>

      <fieldset className="dev-fieldset">
        <legend>Announcement banner</legend>
        <label className="dev-check"><input type="checkbox" checked={draft.announcement.enabled !== false} onChange={(e) => set('enabled', e.target.checked, 'announcement')} /> Show announcement on home</label>
        <label>Title<input value={draft.announcement.title || ''} onChange={(e) => set('title', e.target.value, 'announcement')} /></label>
        <label>Message<textarea value={draft.announcement.text || ''} onChange={(e) => set('text', e.target.value, 'announcement')} rows={3} /></label>
      </fieldset>

      <fieldset className="dev-fieldset">
        <legend>Footer</legend>
        <label>Tagline<input value={draft.footer.tagline || ''} onChange={(e) => set('tagline', e.target.value, 'footer')} /></label>
        <label>Bottom note<input value={draft.footer.note || ''} onChange={(e) => set('note', e.target.value, 'footer')} /></label>
      </fieldset>
    </div>
  )
}

export default function Dev({ onExit, onOpenAdmin }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(DEV_KEY) || '')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('overview')

  const logout = useCallback(() => {
    const t = sessionStorage.getItem(DEV_KEY)
    if (t) api('/dev/logout', { method: 'POST', token: t }).catch(() => {})
    sessionStorage.removeItem(DEV_KEY)
    setToken('')
    setAuthed(false)
  }, [])

  useEffect(() => {
    if (!token) return
    api('/dev/me', { token })
      .then(() => setAuthed(true))
      .catch(() => logout())
  }, [token, logout])

  return (
    <main className="admin">
      {authed ? (
        <>
          <div className="admin-bar">
            <button className="btn" onClick={onExit}>← Store</button>
            <h1>Developer Panel</h1>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
          <div className="chips admin-tabs">
            <button className={`chip ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`chip ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
            <button className={`chip ${tab === 'ui' ? 'active' : ''}`} onClick={() => setTab('ui')}>UI Editor</button>
          </div>
          {tab === 'overview'
            ? <Overview token={token} onUnauthorized={logout} onOpenAdmin={onOpenAdmin} />
            : tab === 'users'
              ? <UsersTab token={token} onUnauthorized={logout} />
              : <UiEditor token={token} onUnauthorized={logout} />}
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