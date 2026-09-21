// Single source of truth for the production origin.
// Used for canonical URLs, sitemap URLs, robots.txt, Open Graph links and JSON-LD.
// If you move off Render to a custom domain, change ONLY this constant.
export const SITE_URL = 'https://shi.onrender.com'

export const siteUrl = SITE_URL
export const absolute = (p) => SITE_URL + p