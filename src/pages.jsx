import { NavLink } from 'react-router-dom'
import founderImg from './assets/Founder.png'
import devImg from './assets/Dev.png'

const INSTA_URL = 'https://www.instagram.com/stickshi_?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=='
const WHATSAPP_URL = 'https://wa.me/918822515437'

const LINKS = [
  { to: '/', label: 'Home', icon: '' },
  { to: '/about', label: 'About', icon: '' },
  { to: '/contact', label: 'Contact', icon: '' },
  { to: '/team', label: 'Team', icon: '' },
  { to: '/report', label: 'Report', icon: '' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `s-link${isActive ? ' active' : ''}`}
          >
            <span className="s-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export function WhatsAppFloat() {
  return (
    <a className="wa-float" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  )
}

export function About() {
  return (
    <main className="page-main">
      <h1>About Stickshi</h1>
      <p className="lead"><b>Created by Shiven Limbu.</b> Made for your vibe.</p>
      <p>Stickshi is a sticker brand founded by <b>Limshin</b>, a musician with a passion for creativity, self-expression, and art.</p>
      <p>From bold designs to fun, aesthetic, and expressive stickers, Stickshi is built to help you put a little more personality into the things you use every day.</p>
      <p>Whether you're decorating your laptop, phone, bottle, notebook, or anything else, Stickshi has something to make it feel more <i>you</i>.</p>
      <p><b>Stick your style. Express yourself. That's Stickshi.</b></p>
    </main>
  )
}

export function Contact() {
  return (
    <main className="page-main">
      <h1>Contact</h1>
      <p>Follow us on Instagram for drops &amp; restocks, or chat with us on WhatsApp for orders and custom stickers.</p>
      <div className="contact-grid">
        <div className="contact-card">
          <h3>Instagram</h3>
          <img className="qr" src="/qr.png" alt="Scan to follow Stickshi on Instagram" />
          <a className="Number" href={INSTA_URL} target="_blank" rel="noreferrer">@stickshi_</a>
        </div>
        <div className="contact-card">
          <h3>WhatsApp</h3>
          <p >Quick replies on orders, restocks &amp; custom sticker requests.</p>
          <a className='Number' href={WHATSAPP_URL} target="_blank" rel="noreferrer">+91 88225 15437</a>
        </div>
      </div>
    </main>
  )
}

export function Team() {
  return (
    <main className="page-main">
      <h1>Team</h1>
      <div className="team-grid">
        <div className="team-card">
          <div className="team-photo-wrap">
            <img src={founderImg} alt="Shiven Limbu" className="team-photo" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span className="team-fallback">🖤</span>
          </div>
          <h3>Shiven Limbu</h3>
          <span className="cat">The Founder and Ceo · Limshin</span>
        </div>
        <div className="team-card">
          <div className="team-photo-wrap">
            <img src={devImg} alt="Aditya Bastola" className="team-photo" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <span className="team-fallback">💻</span>
          </div>
          <h3>Aditya Bastola</h3>
          <span className="cat">Senior Web Developer</span>
        </div>
      </div>
    </main>
  )
}

export function Report() {
  return (
    <main className="page-main">
      <h1>Report</h1>
      <p>Found a bug, a broken order, or a sticker that's just too good to hide?</p>
      <p>Send your report and we'll fix it fast. Include your order ID if you have one.</p>
      <a className="btn dark" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Report on WhatsApp</a>
    </main>
  )
}