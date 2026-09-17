import { useEffect, useState } from 'react'
import { api } from './api.js'

export default function Comments({ userToken, onOpenAuth }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/comments')
      .then((d) => setComments(d.comments))
      .catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true); setErr('')
    try {
      const d = await api('/comments', { method: 'POST', body: { text }, token: userToken })
      setComments((prev) => [d.comment, ...prev])
      setText('')
    } catch (err) {
      setErr(err.message)
    }
    setBusy(false)
  }

  return (
    <section id="comments" className="section comments-section">
      <h2 className="sec-title">💬 Community says</h2>
      <div className="comments-list">
        {comments.length === 0 && <p className="empty">No comments yet. Be the first!</p>}
        {comments.map((c) => (
          <div key={c.id} className={`comment${c.highlighted ? ' highlighted' : ''}`}>
            {c.highlighted && <span className="hl-badge">★ Featured</span>}
            <p>"{c.text}"</p>
            <b>— {c.name}</b>
          </div>
        ))}
      </div>
      {userToken ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea placeholder="Share your Stickshi story…" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
          {err && <p className="err">{err}</p>}
          <button className="btn add" disabled={busy || !text.trim()}>{busy ? 'Posting…' : 'Post comment'}</button>
        </form>
      ) : (
        <button className="btn ghost" onClick={onOpenAuth}>Sign in to comment</button>
      )}
    </section>
  )
}