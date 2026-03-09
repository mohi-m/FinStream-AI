import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IndexTickerCard, TickerCard, TickerDetail, WatchlistPanel } from './components'
import { useSectors, useTopTickers, useWatchlist } from './hooks'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/components/ui'

const INDEX_TICKERS: { tickerId: string; companyName: string }[] = [
  { tickerId: '^GSPC', companyName: 'S&P 500 Index' },
]

const ALL_SECTORS_VALUE = '__all__'

export function OverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, maxSize } = useWatchlist()
  const [sector, setSector] = useState<string>(ALL_SECTORS_VALUE)

  const { data: sectorsData, isLoading: sectorsLoading } = useSectors()
  const sectors = useMemo(() => sectorsData || [], [sectorsData])

  const selectedSector = sector === ALL_SECTORS_VALUE ? undefined : sector
  const {
    data: topTickersData,
    isLoading: topTickersLoading,
    error: topTickersError,
  } = useTopTickers({ limit: 6, sector: selectedSector })

  const topTickers = useMemo(
    () => (topTickersData || []).filter((t) => (t.tickerId || '').trim().length > 0),
    [topTickersData]
  )

  const selectedTickerParam = searchParams.get('ticker')?.trim().toUpperCase()
  const selectedTicker =
    selectedTickerParam && selectedTickerParam.length > 0 ? selectedTickerParam : null
  const pageContainerClass = 'mx-auto w-full max-w-screen-2xl px-2 sm:px-3 lg:px-4'

  const handleSelectTicker = (tickerId: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('ticker', tickerId)
    setSearchParams(nextParams)
  }

  const handleBackFromTicker = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('ticker')
    setSearchParams(nextParams, { replace: true })
  }

  if (selectedTicker) {
    return (
      <div className={pageContainerClass}>
        <TickerDetail
          tickerId={selectedTicker}
          onBack={handleBackFromTicker}
          watchlist={watchlist}
          addToWatchlist={addToWatchlist}
          removeFromWatchlist={removeFromWatchlist}
          isInWatchlist={isInWatchlist}
          maxSize={maxSize}
        />
      </div>
    )
  }

  return (
    <div
      className={`${pageContainerClass} space-y-8 lg:flex lg:h-[calc(100dvh-7.5rem)] lg:flex-col lg:space-y-3`}
    >
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Market snapshot and watchlist</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8 lg:flex lg:min-h-0 lg:flex-col lg:space-y-3">
          <div className="space-y-4">
            {INDEX_TICKERS.map((ticker) => (
              <IndexTickerCard
                key={ticker.tickerId}
                tickerId={ticker.tickerId}
                companyName={ticker.companyName}
                onClick={() => handleSelectTicker(ticker.tickerId)}
              />
            ))}
          </div>

          <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-lg ring-1 ring-primary/10 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <CardHeader className="relative p-5 pb-3 lg:p-4 lg:pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Top stocks</CardTitle>
                  <CardDescription>Top performers over the last 7 days</CardDescription>
                </div>

                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="h-8 w-44" disabled={sectorsLoading}>
                    <SelectValue placeholder="All sectors" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value={ALL_SECTORS_VALUE}>All sectors</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="relative p-5 pt-0 lg:min-h-0 lg:flex-1 lg:p-4 lg:pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:auto-rows-max lg:content-start lg:gap-3">
                {topTickersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card
                      key={i}
                      className="relative overflow-hidden border-border/60 bg-card/80 shadow-md ring-1 ring-primary/10"
                    >
                      <CardHeader className="relative p-4 pb-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-28" />
                      </CardHeader>
                      <CardContent className="relative p-4 pt-0">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-16 w-full mt-4" />
                      </CardContent>
                    </Card>
                  ))
                ) : topTickersError ? (
                  <div className="col-span-full text-sm text-muted-foreground">
                    Unable to load top stocks right now.
                  </div>
                ) : topTickers.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground">
                    No stocks found.
                  </div>
                ) : (
                  topTickers.map((ticker) => (
                    <TickerCard
                      key={ticker.tickerId}
                      tickerId={ticker.tickerId || ''}
                      companyName={ticker.companyName || '—'}
                      weeklyPercentChange={ticker.weeklyPercentChange}
                      onClick={() => handleSelectTicker(ticker.tickerId || '')}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 lg:min-h-0">
          <WatchlistPanel
            tickerIds={watchlist}
            onSelectTicker={handleSelectTicker}
            onAddTicker={addToWatchlist}
            maxSize={maxSize}
            className="lg:h-full"
          />
        </div>
      </div>
    </div>
  )
}
