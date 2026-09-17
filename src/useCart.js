import { useEffect, useState } from 'react'

const KEY = 'stickshi-cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function useCart() {
  const [items, setItems] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = (id, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.id === id)
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
      return [...prev, { id, qty }]
    })

  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    )

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clear = () => setItems([])
  const count = items.reduce((s, i) => s + i.qty, 0)

  return { items, add, setQty, remove, clear, count }
}