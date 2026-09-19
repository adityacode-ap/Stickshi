import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { products as seedProducts } from '../src/Javascripts/data.js'
import { hashPassword } from './auth.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const file = (name) => path.join(dir, `${name}.json`)

function read(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file(name), 'utf8'))
  } catch {
    return fallback
  }
}

function write(name, data) {
  fs.writeFileSync(file(name), JSON.stringify(data, null, 2))
}

export const getProducts = () => read('products', seedProducts)
export const saveProducts = (list) => write('products', list)
export const getOrders = () => read('orders', [])
export const getUsers = () => read('users', [])
export const saveUsers = (list) => write('users', list)
export const getComments = () => read('comments', [])
export const saveComments = (list) => write('comments', list)

export function saveOrder(order) {
  const list = getOrders()
  list.unshift(order)
  write('orders', list)
}

export function getAdmin() {
  const existing = read('admins', null)
  if (existing) return existing[0]
  const admin = {
    email: process.env.ADMIN_EMAIL || 'Adityabastola.work@gmail.com',
    ...hashPassword(process.env.ADMIN_PASSWORD || 'Aditya@1.2.3.4'),
    createdAt: new Date().toISOString(),
  }
  write('admins', [admin])
  return admin
}

const DEFAULT_CONFIG = {
  siteOpen: true,
  commentsEnabled: true,
  announcement: {
    enabled: true,
    title: '⭐ Coming soon: Review Stars!',
    text: 'Every sticker is about to get a 1–5 star rating from real customers. The best-loved designs get crowned Stickshi Favourites — stick around!',
  },
  hero: {
    title: 'Have Some STICKSHIsss!',
    highlight: 'STICKSHIsss!',
    scheme: 'Follow our Instagram page for an extra 10% discount on next order!',
    subtitle: 'Premium stickers for your laptop, phone, bottles & more — made by Limshin, delivered across India.',
    shopCta: 'Shop Now',
    exploreCta: 'Explore Collections',
  },
  footer: {
    tagline: 'Sticker brand by Limshin — arts, music & stickers.',
    note: 'All rights reserved to Stickshi-Made proudly in भारत',
  },
}

export function getConfig() {
  return read('config', null) || DEFAULT_CONFIG
}

export const saveConfig = (cfg) => write('config', cfg)