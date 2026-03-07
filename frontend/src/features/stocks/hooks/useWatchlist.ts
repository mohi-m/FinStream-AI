import { useState, useEffect } from 'react'

const WATCHLIST_KEY = 'finstream_watchlist'
const MAX_WATCHLIST_SIZE = 10
const DEFAULT_WATCHLIST = ['MSFT', 'NVDA', 'BLK', 'ABBV', 'CEG', 'AEE', 'DIS']

function normalizeWatchlist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0)

  return Array.from(new Set(normalized)).slice(0, MAX_WATCHLIST_SIZE)
}

function getInitialWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY)

    if (!stored) {
      return DEFAULT_WATCHLIST
    }

    const parsed = JSON.parse(stored)
    const normalized = normalizeWatchlist(parsed)

    return normalized.length > 0 ? normalized : DEFAULT_WATCHLIST
  } catch {
    return DEFAULT_WATCHLIST
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(getInitialWatchlist)

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  const addToWatchlist = (tickerId: string) => {
    if (watchlist.length >= MAX_WATCHLIST_SIZE) {
      return false
    }
    if (!watchlist.includes(tickerId)) {
      setWatchlist([...watchlist, tickerId])
    }
    return true
  }

  const removeFromWatchlist = (tickerId: string) => {
    setWatchlist(watchlist.filter((id) => id !== tickerId))
  }

  const isInWatchlist = (tickerId: string) => {
    return watchlist.includes(tickerId)
  }

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    maxSize: MAX_WATCHLIST_SIZE,
  }
}
