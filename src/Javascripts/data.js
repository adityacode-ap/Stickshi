export const categories = ['All', 'Anime', 'Cars', 'Gaming', 'Aesthetic', 'Memes', 'Custom']

export const categoryIcons = { Anime: '🌀', Cars: '🏎️', Gaming: '🎮', Aesthetic: '🌸', Memes: '😂', Custom: '🎨' }

export const vibes = [
  { name: 'Dark & Edgy', emoji: '🖤' },
  { name: 'Cute & Aesthetic', emoji: '🌸' },
  { name: 'Speed Freak', emoji: '🏎️' },
  { name: 'Gamer', emoji: '🎮' },
  { name: 'Meme Lord', emoji: '😂' },
]

export const reviews = [
  { name: 'Aarav S.', city: 'Bengaluru', text: 'Stickers survived a full holi season on my laptop. The cut lines are insanely clean.', stars: 5 },
  { name: 'Priya M.', city: 'Pune', text: 'The Oni Mask sticker is too good. Delivered in 3 days and the matte finish is top notch.', stars: 5 },
  { name: 'Rohan K.', city: 'Delhi', text: 'Got my own art turned into a custom sticker — it came out absolutely perfect. Will order again!', stars: 4 },
]

export const products = [
  { id: 1, name: 'Naruto Run', category: 'Anime', vibe: 'Meme Lord', price: 69, emoji: '🌀', bg: '#fff3cd', desc: 'Iconic running pose, glossy 4-inch sticker.', rating: 4.9, bestseller: true, image: '/Favicon.jpeg' },
  { id: 2, name: 'Sakura Bloom', category: 'Anime', vibe: 'Cute & Aesthetic', price: 65, emoji: '🌸', bg: '#ffe0ec', desc: 'Soft pink anime aesthetic peelable sticker.', rating: 4.8, isNew: true, image: '/Favicon.jpeg' },
  { id: 3, name: 'Oni Mask', category: 'Anime', vibe: 'Dark & Edgy', price: 79, emoji: '👹', bg: '#fde2e2', desc: 'Bold demon mask design, premium vinyl.', rating: 4.7, bestseller: true, image: '/Favicon.jpeg' },
  { id: 4, name: 'Drift King', category: 'Cars', vibe: 'Speed Freak', price: 69, emoji: '🏎️', bg: '#e6ecf2', desc: 'Twin-turbo drift missile for your bumper.', rating: 4.8, bestseller: true, isNew: true, image: '/Favicon.jpeg' },
  { id: 5, name: 'GTR Beast', category: 'Cars', vibe: 'Speed Freak', price: 75, emoji: '🚗', bg: '#ece4f2', desc: 'Godzilla-grade JDM icon, matte finish.', rating: 4.7, isNew: true, image: '/Favicon.jpeg' },
  { id: 6, name: 'Retro Bike', category: 'Cars', vibe: 'Speed Freak', price: 62, emoji: '🏍️', bg: '#f0e6d2', desc: 'Vintage café racer silhouette sticker.', rating: 4.6, image: '/Favicon.jpeg' },
  { id: 7, name: 'OG Gamer', category: 'Gaming', vibe: 'Gamer', price: 69, emoji: '🎮', bg: '#e8f2e8', desc: 'Respawn on your laptop lid, premium vinyl.', rating: 4.9, bestseller: true, isNew: true, image: '/Favicon.jpeg' },
  { id: 8, name: 'Pixel Heart', category: 'Gaming', vibe: 'Gamer', price: 55, emoji: '🕹️', bg: '#f2ede8', desc: '8-bit love for arcade & speedrun fans.', rating: 4.6, image: '/Favicon.jpeg' },
  { id: 9, name: 'GG No Re', category: 'Gaming', vibe: 'Gamer', price: 49, emoji: '💀', bg: '#f0e8f2', desc: 'Toxic gamer approved, glare-resistant.', rating: 4.5, image: '/Favicon.jpeg' },
  { id: 10, name: 'Abstract Sun', category: 'Aesthetic', vibe: 'Cute & Aesthetic', price: 55, emoji: '🌅', bg: '#fff4e0', desc: 'Minimal wave sun, fits any journal.', rating: 4.6, bestseller: true, image: '/Favicon.jpeg' },
  { id: 11, name: 'Boho Flower', category: 'Aesthetic', vibe: 'Cute & Aesthetic', price: 58, emoji: '🌼', bg: '#f2f8e8', desc: 'Soft boho florals for tumblers & planners.', rating: 4.7, isNew: true, image: '/Favicon.jpeg' },
  { id: 12, name: 'Cloud Dream', category: 'Aesthetic', vibe: 'Cute & Aesthetic', price: 52, emoji: '☁️', bg: '#e8f0f8', desc: 'Floating daydream, die-cut to the cloud.', rating: 4.6, image: '/Favicon.jpeg' },
  { id: 13, name: "It's a Vibe", category: 'Memes', vibe: 'Meme Lord', price: 49, emoji: '😂', bg: '#fdf3d3', desc: 'Certified vibe check, gloss finish.', rating: 4.6, image: '/Favicon.jpeg' },
  { id: 14, name: 'Doge Classic', category: 'Memes', vibe: 'Meme Lord', price: 55, emoji: '🐶', bg: '#f2ecd8', desc: 'Such sticker. Many wow. Very vinyl.', rating: 4.8, bestseller: true, isNew: true, image: '/Favicon.jpeg' },
  { id: 15, name: 'No Thoughts', category: 'Memes', vibe: 'Meme Lord', price: 45, emoji: '🫥', bg: '#e8ecef', desc: 'Head empty, sticker here instead.', rating: 4.5, image: '/Favicon.jpeg' },
  { id: 16, name: 'Design Your Own', category: 'Custom', price: 99, emoji: '🎨', bg: '#fdf0e4', desc: 'Send your photo, artwork or logo and we turn it into a die-cut sticker.', rating: 5, image: '/Favicon.jpeg' },
]

export const shippingFee = 70
export const freeShippingAbove = 499
export const codFee = 25
export const formatINR = (n) => `₹${n}`