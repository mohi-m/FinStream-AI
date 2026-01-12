import { useState } from 'react'
import { TickerCard, TickerDetail, TickerSearch } from './components'
import { useWatchlist } from './hooks/useWatchlist'
import type { TickerDto } from '@/lib/api'

// Top 5 S&P 500 tickers to display by default
const TOP_TICKERS: { tickerId: string; companyName: string }[] = [
  { tickerId: 'AAPL', companyName: 'Apple Inc.' },
  { tickerId: 'MSFT', companyName: 'Microsoft Corporation' },
  { tickerId: 'AMZN', companyName: 'Amazon.com Inc.' },
  { tickerId: 'NVDA', companyName: 'NVIDIA Corporation' },
  { tickerId: 'GOOGL', companyName: 'Alphabet Inc.' },
]

export function StocksPage() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const { watchlist } = useWatchlist()

  const handleSelectTicker = (ticker: TickerDto) => {
    if (ticker.tickerId) {
      setSelectedTicker(ticker.tickerId)
    }
  }

  if (selectedTicker) {
    return <TickerDetail tickerId={selectedTicker} onBack={() => setSelectedTicker(null)} />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Stocks</h1>
        <p className="text-muted-foreground">Track and analyze stock performance</p>
      </div>

      {/* Search */}
      <TickerSearch onSelect={handleSelectTicker} />

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Watchlist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {watchlist.map((tickerId) => {
              const topTicker = TOP_TICKERS.find((t) => t.tickerId === tickerId)
              return (
                <TickerCard
                  key={tickerId}
                  tickerId={tickerId}
                  companyName={topTicker?.companyName || tickerId}
                  onClick={() => setSelectedTicker(tickerId)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Top S&P 500 Tickers */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Top S&P 500 Stocks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TOP_TICKERS.map((ticker) => (
            <TickerCard
              key={ticker.tickerId}
              tickerId={ticker.tickerId}
              companyName={ticker.companyName}
              onClick={() => setSelectedTicker(ticker.tickerId)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
