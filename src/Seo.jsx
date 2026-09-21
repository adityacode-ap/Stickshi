import { useEffect } from 'react'
import { SITE_URL } from './site.js'

const APP_NAME = 'Stickshi'
const DEFAULT_IMAGE = '/Comingsoon.png'

const brandTitle = (title) => (title.includes(APP_NAME) ? title : `${title} | Stickshi`)

function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setProperty(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function updateJsonLd(jsonLd) {
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((n) => n.remove())
  if (!jsonLd) return
  const list = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
  for (const obj of list) {
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.setAttribute('data-seo-jsonld', '')
    s.textContent = JSON.stringify(obj)
    document.head.appendChild(s)
  }
}

/**
 * Client-side SEO manager for an SPA. Sets document title, meta description,
 * canonical link, Open Graph / Twitter tags, robots and JSON-LD per view.
 */
export default function Seo({ title, description, path = '/', image, noindex = false, jsonLd }) {
  useEffect(() => {
    const fullTitle = brandTitle(title || APP_NAME)
    const url = SITE_URL + (path === '/' ? '/' : path)
    const img = image ? SITE_URL + image : SITE_URL + DEFAULT_IMAGE

    document.title = fullTitle
    setMeta('description', description || '')
    setCanonical(url)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setProperty('og:site_name', APP_NAME)
    setProperty('og:type', 'website')
    setProperty('og:title', fullTitle)
    setProperty('og:description', description || '')
    setProperty('og:url', url)
    setProperty('og:image', img)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description || '')
    setMeta('twitter:image', img)
    updateJsonLd(jsonLd)
  }, [title, description, path, image, noindex, jsonLd])

  return null
}