import { useState } from 'react'
import { formatINR, freeShippingAbove, shippingFee } from './Javascripts/data.js'
import { api } from './Javascripts/api.js'

export default function CustomOrder({ product, onBack, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' })
  const [stickerName, setStickerName] = useState('')
  const [description, setDescription] = useState('')
  const [qty, setQty] = useState(1)
  const [pay, setPay] = useState('UPI')
  const [placing, setPlacing] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (!product) {
    return (
      <main className="center">
        <p className="empty">Loading custom sticker…</p>
        <button className="btn" onClick={onBack}>← Back</button>
      </main>
    )
  }

  const subtotal = product.price * qty
  const shipping = subtotal >= freeShippingAbove ? 0 : shippingFee
  const total = subtotal + shipping

  const valid =
    stickerName.trim() && description.trim() &&
    form.name && form.email.includes('@') && /^\d{10}$/.test(form.phone) &&
    form.address && form.city && form.state && /^\d{6}$/.test(form.pincode)

  const place = async () => {
    setPlacing(true)
    try {
      const saved = await api('/orders', {
        method: 'POST',
        body: {
          ...form,
          pay,
          total,
          count: qty,
          items: [{ name: product.name, emoji: product.emoji, qty, price: product.price, category: product.category, customData: { name: stickerName.trim(), description: description.trim() } }],
        },
      })
      onDone({ ...saved, count: qty, name: form.name, city: form.city, pincode: form.pincode })
    } catch (e) {
      setPlacing(false)
      alert(e.message)
    }
  }

  return (
    <main className="checkout">
      <button className="back" onClick={onBack}>← Back to shop</button>
      <h1>🎨 Order a Custom Sticker</h1>
      <div className="cart-layout">
        <section className="form">
          <h3>Design details</h3>
          <input placeholder="Sticker name (e.g. My GTR, Custom logo)" aria-label="Sticker name" value={stickerName} onChange={(e) => setStickerName(e.target.value)} maxLength={60} />
          <textarea placeholder="Describe your design — your idea, art, photo, logo, colors, size, style. Anything that helps us nail it." aria-label="Design description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} />
          <p className="custom-note">Price covers one custom die-cut sticker. Pay &amp; place your order via UPI or PayPal.</p>

          <h3>Quantity</h3>
          <div className="qty-row">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <h3>Delivery Details</h3>
          <input placeholder="Full name" aria-label="Full name" value={form.name} onChange={set('name')} required />
          <input placeholder="Email" type="email" aria-label="Email" value={form.email} onChange={set('email')} required />
          <input placeholder="Phone (10 digits)" aria-label="Phone" value={form.phone} onChange={set('phone')} inputMode="numeric" required />
          <textarea placeholder="Address (house no, street, area)" aria-label="Address" value={form.address} onChange={set('address')} required />
          <div className="row2">
            <input placeholder="City" aria-label="City" value={form.city} onChange={set('city')} required />
            <input placeholder="State" aria-label="State" value={form.state} onChange={set('state')} required />
          </div>
          <input placeholder="Pincode (6 digits)" aria-label="Pincode" value={form.pincode} onChange={set('pincode')} inputMode="numeric" required />

          <h3>Payment Method</h3>
          <div className="pay-options">
            {['UPI', 'PayPal'].map((m) => (
              <button key={m} className={`chip ${pay === m ? 'active' : ''}`} onClick={() => setPay(m)}>{m}</button>
            ))}
          </div>
        </section>

        <aside className="summary">
          <h3>Order Summary</h3>
          <p className="line"><span>Custom sticker × {qty}</span><span>{formatINR(subtotal)}</span></p>
          <hr />
          <p><span>Shipping</span><span>{shipping ? formatINR(shipping) : 'FREE'}</span></p>
          <p className="total"><span>Total</span><span>{formatINR(total)}</span></p>
          <button
            className="btn add wide"
            disabled={!valid || placing}
            onClick={place}
          >
            {!valid ? 'Fill all details' : placing ? 'Placing order…' : `Pay ${formatINR(total)}`}
          </button>
        </aside>
      </div>
    </main>
  )
}