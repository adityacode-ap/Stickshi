import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { products as seedProducts } from '../src/data.js'
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