import { useState, useEffect } from 'react'

const WATCHLIST_KEY = 'finstream_watchlist'
const MAX_WATCHLIST_SIZE = 10

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY)
    return stored ? JSON.parse(stored) : []
  })

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
