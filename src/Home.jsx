import { useEffect, useMemo, useState } from 'react'
import { categoryIcons, categories, formatINR, freeShippingAbove, reviews, vibes } from './Javascripts/data.js'
import { Star } from './ui.jsx'
import Comments from './Comments.jsx'
import animePoster from './assets/anime-poster.png'
import { api } from './Javascripts/api.js'

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

function ProductCard({ p, onOpen, onAdd }) {
  return (
    <article className="card" style={{ background: p.bg }}>
      {p.bestseller && <span className="badge">Bestseller</span>}
      {p.isNew && <span className="badge new">New</span>}
      <button className="sticker-art" onClick={() => onOpen(p)} aria-label={p.name}>{p.image ? <img src={p.image} alt={p.name} className="sticker-img" /> : p.emoji}</button>
      <div className="card-body">
        <h3 onClick={() => onOpen(p)}>{p.name}</h3>
        <span className="cat">{p.category}</span>
        <div className="meta">
          <span className="price">{formatINR(p.price)}</span>
          <span className="rating"><Star />{p.rating}</span>
        </div>
        <button className="btn add" onClick={() => onAdd(p.id)}>Add to Cart</button>
      </div>
    </article>
  )
}



export default function Home({ products, onOpen, onAdd, userToken, onOpenAuth, onCreateCustom }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [vibe, setVibe] = useState(null)
  const [sort, setSort] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(100)
  const [ui, setUi] = useState(null)

  useEffect(() => {
    api('/config').then(setUi).catch(() => {})
  }, [])

  const hero = ui?.hero || {}
  const footer = ui?.footer || {}
  const announcement = ui?.announcement || {}
  const siteOpen = ui ? ui.siteOpen !== false : true
  const commentsEnabled = ui ? ui.commentsEnabled !== false : true

  const heroMarkup = (() => {
    const t = hero.title
    const h = hero.highlight
    if (h && t && t.includes(h)) {
      const i = t.indexOf(h)
      return <>{t.slice(0, i)}<span className="hl">{h}</span>{t.slice(i + h.length)}</>
    }
    return <>{t && t || 'Have Some '}{h && <span className="hl">{h}</span>}</>
  })()

  const list = useMemo(() => {
    let l = products.filter(
      (p) =>
        (cat === 'All' || p.category === cat) &&
        (!vibe || p.vibe === vibe) &&
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        p.price <= maxPrice,
    )
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price)
    else l = [...l].sort((a, b) => b.rating - a.rating)
    return l
  }, [products, query, cat, vibe, sort, maxPrice])

  const filtered = query || cat !== 'All' || vibe || maxPrice < 100
  const gridProducts = filtered ? list : list.filter((p) => p.bestseller)
  const fresh = products.filter((p) => p.isNew)
  const activeVibe = vibe && vibes.find((v) => v.name === vibe)

  const gridTitle = activeVibe
    ? `${activeVibe.emoji} ${activeVibe.name}`
    : filtered
      ? 'Results'
      : '🔥 Trending Now'

  const pickCat = (c) => { setCat(c); setVibe(null); setMaxPrice(100); setTimeout(() => scrollTo('shop'), 0) }

  const clearFilters = () => { setCat('All'); setVibe(null); setQuery(''); setMaxPrice(100) }

  return (
    <main className="home">
      {!siteOpen && (
        <div className="maintenance-bar" role="status">
          🔧 The shop is temporarily closed — no new orders right now, but feel free to look around!
        </div>
      )}
      {announcement.enabled && announcement.text && (
        <section className="announcement-bar" role="status">
          <span className="announce-emoji" aria-hidden="true">📢</span>
          <div className="announce-text">
            <b>{announcement.title || 'Announcement'}</b>
            <p>{announcement.text}</p>
          </div>
        </section>
      )}

      <section className="hero">
        <div className="hero-text">
          <h1>{heroMarkup}</h1>
          {hero.scheme !== '' && <h4 className='Scheme'>{hero.scheme ?? 'Follow our Instagram page for an extra 10% discount on next order!'}</h4>}
          <p>{hero.subtitle ?? 'Premium stickers for your laptop, phone, bottles &amp; more — made by Limshin, Assam Delivary Free.'}</p>
          <div className="hero-cta">
            <button className="btn dark" onClick={() => scrollTo('shop')}>{hero.shopCta ?? 'Shop Now'}</button>
            <button className="btn ghost" onClick={() => scrollTo('collections')}>{hero.exploreCta ?? 'Explore Collections'}</button>
          </div>
        </div>
        <div className="hero-poster" aria-hidden="true">
          <img src={animePoster} alt="" className="hero-poster-img" />
        </div>
      </section>

      <section className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <div className="marquee-group" key={k}>
              {['Free shipping over ₹499', 'All India delivery', 'Waterproof', 'Made by Limshin', 'Original'].map((t) => (
                <span key={`${k}-${t}`}>{t}<i>✦</i></span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="collections" className="section">
        <h2 className="sec-title">Categories</h2>
        <div className="cats-row">
          {categories.filter((c) => c !== 'All').map((c) => (
            <button key={c} className={`cat-card ${cat === c ? 'active' : ''}`} onClick={() => pickCat(c)}>
              <span className="cat-emoji">{categoryIcons[c]}</span>
              <span>{c}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="shop" className="section">
        <div className="shop-head">
          <h2 className="sec-title">{gridTitle}</h2>
          {filtered && <button className="clear" onClick={clearFilters}>✕ Clear filters</button>}
        </div>

        <div className="controls">
          <input className="search" placeholder="Search stickers…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="chips">
            {categories.map((c) => (
              <button key={c} className={`chip ${cat === c && !vibe ? 'active' : ''}`} onClick={() => pickCat(c)}>{c}</button>
            ))}
          </div>
          <div className="filter-row">
            <label>Max price: <b>{formatINR(maxPrice)}</b>
              <input type="range" min="40" max="100" value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid">
          {gridProducts.length === 0 && <p className="empty">{maxPrice < 100 ? 'No stickers under this price. Raise the max price filter to see more.' : 'No stickers found.'}</p>}
          {gridProducts.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
        </div>
      </section>

      <section id="vibes" className="section">
        <h2 className="sec-title">What's your vibe?</h2>
        <div className="vibes-row">
          {vibes.map((v) => (
            <button key={v.name} className={`vibe-card ${vibe === v.name ? 'active' : ''}`} onClick={() => { setVibe(vibe === v.name ? null : v.name); setTimeout(() => scrollTo('shop'), 0) }}>
              <span className="vibe-emoji">{v.emoji}</span>
              <span className="vibe-name">{v.name}</span>
              <span className="vibe-count">{products.filter((p) => p.vibe === v.name).length} designs</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="sec-title">Why Stickshi?</h2>
        <div className="why-grid">
          <div className="why-card"><span>🚚</span><b>All India Delivery and Assam Delivary Free</b><small>Free shipping over {formatINR(freeShippingAbove)}</small></div>
          <div className="why-card"><span>✨</span><b>Premium Quality</b><small>Waterproof matte vinyl</small></div>
          <div className="why-card"><span>💰</span><b>Affordable Prices</b><small>Starting at {formatINR(45)}</small></div>
          <div className="why-card"><span>🎨</span><b>Unique Designs</b><small>Original art by Limshin</small></div>
        </div>
      </section>

      <section className="section">
        <h2 className="sec-title">🆕 Fresh Drops</h2>
        <div className="grid">
          {fresh.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpen} onAdd={onAdd} />)}
        </div>
      </section>

      <section className="custom">
        <span className="custom-art">🎨</span>
        <h2>Got your own design?</h2>
        <p>Turn your photo, artwork or logo into a one-of-a-kind die-cut sticker.</p>
        <button className="btn dark" onClick={onCreateCustom ?? (() => pickCat('Custom'))}>Create Your Sticker</button>
      </section>

      <section className="section">
        <h2 className="sec-title">What customers say</h2>
        <div className="reviews-row">
          {reviews.map((r) => (
            <div className="review" key={r.name}>
              <div className="stars">{'★'.repeat(r.stars)}</div>
              <p>"{r.text}"</p>
              <b>— {r.name}, {r.city}</b>
            </div>
          ))}
        </div>
      </section>

      <Comments userToken={userToken} onOpenAuth={onOpenAuth} enabled={commentsEnabled} />

      <section className="insta">
        <h2>Made to be stuck. Made to be seen.</h2>
        <p>Follow <b>@stickshi_</b> for new drops &amp; collabs.</p>
        <div className="insta-tiles" aria-hidden="true">
          <span>🐶</span><span>🌸</span><span>🏎️</span><span>🌀</span><span>👾</span><span>☁️</span>
        </div>
        <img className="qr" src="/qr.png" alt="Scan to follow Stickshi on Instagram" />
        <a className="btn dark" href="https://www.instagram.com/stickshi_?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer">Follow on Instagram</a>
      </section>

      <footer id="footer" className="footer">
        <div className="fcol brand">
          <b>Stickshi</b>
          <small>{footer.tagline || 'Sticker brand by <b>Limshin</b> — arts, music &amp; stickers.'}</small>
        </div>
        <div className="fcols">
          <div className="fcol">
            <h4>Shop</h4>
            <button className="flink" onClick={() => { clearFilters(); setTimeout(() => scrollTo('shop'), 0) }}>All Stickers</button>
            <button className="flink" onClick={() => scrollTo('shop')}>Best Sellers</button>
            <button className="flink" onClick={() => scrollTo('vibes')}>New Arrivals</button>
          </div>
          <div className="fcol">
            <h4>Categories</h4>
            {categories.filter((c) => c !== 'All').map((c) => (
              <button key={c} className="flink" onClick={() => pickCat(c)}>{c}</button>
            ))}
          </div>
          <div className="fcol">
            <h4>Help</h4>
            <span className="fspan">Track Order</span>
            <span className="fspan">Contact</span>
            <span className="fspan">FAQ</span>
            <span className="fspan">Instagram</span>
          </div>
          <div className="fcol">
            <h4>Legal</h4>
            <span className="fspan">Terms</span>
            <span className="fspan">Privacy</span>
          </div>
        </div>
        <p className="copy">{footer.note || 'All rights reserved to Stickshi-Made proudly in भारत'}</p>
      </footer>
    </main>
  )
}