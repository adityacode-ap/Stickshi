import { useEffect, useRef, useState } from 'react'
import { api } from './Javascripts/api.js'
import { setUserToken } from './Javascripts/userAuth.js'

function GoogleButton({ clientId, disabled, onCredential }) {
  const ref = useRef(null)
  const cbRef = useRef(onCredential)
  useEffect(() => { cbRef.current = onCredential })

  useEffect(() => {
    if (!clientId || !ref.current) return
    let cancelled = false
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return
      try {
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cbRef.current(r.credential) })
        ref.current.innerHTML = ''
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', width: '100%', text: 'continue_with' })
      } catch { void 0 }
    }
    if (window.google?.accounts?.id) { init(); return }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) { existing.addEventListener('load', init, { once: true }); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client?hl=hi'
    s.async = true
    s.onload = init
    document.head.appendChild(s)
    return () => { cancelled = true }
  }, [clientId])

  if (!clientId) {
    return <p className="google-note">Google sign-in needs <code>GOOGLE_CLIENT_ID</code> set on the server. Sign up with your phone for now.</p>
  }
  return <div className={disabled ? 'google-btn disabled' : 'google-btn'} ref={ref} />
}

function Field({ label, ...props }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export default function AuthPanel({ onClose, onAuth }) {
  const [mode, setMode] = useState('signin') // signin | signup | reset | reset-confirm
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    api('/config').then((d) => setClientId(d.googleClientId)).catch(() => {})
  }, [])

  const fail = (e) => { setErr(e.message); setMsg(''); setBusy(false) }

  const submitSignin = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const d = await api('/auth/login', { method: 'POST', body: { phone, password } })
      setUserToken(d.token)
      onAuth(d.user)
      onClose()
    } catch (err) { fail(err) }
  }

  const submitSignup = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const d = await api('/auth/signup', { method: 'POST', body: { name, phone, password } })
      setUserToken(d.token)
      onAuth(d.user)
      onClose()
    } catch (err) { fail(err) }
  }

  const submitResetRequest = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const d = await api('/auth/reset-request', { method: 'POST', body: { phone } })
      setDevOtp(d.dev || '')
      setMsg(d.dev ? `Dev mode: your OTP is ${d.dev}` : 'OTP sent to your phone')
      setMode('reset-confirm')
      setBusy(false)
    } catch (err) { fail(err) }
  }

  const submitResetConfirm = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await api('/auth/reset-confirm', { method: 'POST', body: { phone, otp, newPassword } })
      setMsg('Password reset!')
      setPassword('')
      setOtp('')
      setNewPassword('')
      setMode('signin')
      setBusy(false)
    } catch (err) { fail(err) }
  }

  const googleSignin = async (credential) => {
    setBusy(true); setErr('')
    try {
      const d = await api('/auth/google', { method: 'POST', body: { credential } })
      setUserToken(d.token)
      onAuth(d.user)
      onClose()
    } catch (err) { fail(err) }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>
        <h2>{mode === 'signup' ? 'Create account' : mode === 'reset' || mode === 'reset-confirm' ? 'Reset password' : 'Sign in'}</h2>

        {mode === 'signin' && (
          <form className="auth-form" onSubmit={submitSignin}>
            <Field label="Phone number" type="tel" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Field label="Password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err && <p className="err">{err}</p>}
            <button className="btn add wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" className="link" onClick={() => { setErr(''); setMsg(''); setMode('reset') }}>Forgot password?</button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="auth-form" onSubmit={submitSignup}>
            <Field label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field label="Phone number" type="tel" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Field label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err && <p className="err">{err}</p>}
            <button className="btn add wide" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          </form>
        )}

        {mode === 'reset' && (
          <form className="auth-form" onSubmit={submitResetRequest}>
            <Field label="Phone number" type="tel" placeholder="Registered 10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            {err && <p className="err">{err}</p>}
            {msg && <p className="ok">{msg}</p>}
            <button className="btn add wide" disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button>
          </form>
        )}

        {mode === 'reset-confirm' && (
          <form className="auth-form" onSubmit={submitResetConfirm}>
            {devOtp && <p className="ok">Dev mode: your OTP is <b>{devOtp}</b></p>}
            <Field label="OTP" inputMode="numeric" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            <Field label="New password" type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            {err && <p className="err">{err}</p>}
            {msg && <p className="ok">{msg}</p>}
            <button className="btn add wide" disabled={busy}>{busy ? 'Resetting…' : 'Set new password'}</button>
          </form>
        )}

        {mode !== 'reset' && mode !== 'reset-confirm' && (
          <div className="auth-divider"><span>or continue with</span></div>
        )}
        {mode === 'signin' && <GoogleButton clientId={clientId} disabled={busy} onCredential={googleSignin} />}

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>New here? <button type="button" className="link" onClick={() => { setErr(''); setMode('signup') }}>Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" className="link" onClick={() => { setErr(''); setMsg(''); setMode('signin') }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}