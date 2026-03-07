import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import { useLatestPrice, useTicker } from '../hooks'
import { TickerSearch } from './TickerSearch'
import { Plus } from 'lucide-react'

interface WatchlistPanelProps {
  tickerIds: string[]
  onSelectTicker: (tickerId: string) => void
  onAddTicker: (tickerId: string) => boolean
  maxSize: number
  className?: string
}

interface WatchlistRowProps {
  tickerId: string
  onSelect: (tickerId: string) => void
}

function WatchlistRow({ tickerId, onSelect }: WatchlistRowProps) {
  const { data: ticker, isLoading: tickerLoading } = useTicker(tickerId)
  const { data: price, isLoading: priceLoading } = useLatestPrice(tickerId)

  const open = price?.open
  const close = price?.close

  const changePct =
    typeof open === 'number' && typeof close === 'number' && open !== 0
      ? ((close - open) / open) * 100
      : null

  const isPositive = changePct === null ? true : changePct >= 0
  const changeText =
    changePct === null ? '--' : `${changePct > 0 ? '+' : ''}${formatPercent(changePct)}`

  return (
    <button
      type="button"
      onClick={() => onSelect(tickerId)}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-4 py-2 text-left',
        'transition-colors hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-semibold">
            {tickerId.replace(/\^/g, '').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium leading-5">{tickerId}</div>
          {tickerLoading ? (
            <Skeleton className="mt-1 h-3 w-28" />
          ) : (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {ticker?.companyName || '—'}
            </div>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        {priceLoading ? (
          <>
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="mt-1 h-3 w-12 ml-auto" />
          </>
        ) : (
          <>
            <div className="text-sm font-medium tabular-nums">
              {typeof close === 'number' ? formatCurrency(close) : '--'}
            </div>
            <div
              className={cn('text-xs tabular-nums', isPositive ? 'text-green-500' : 'text-red-500')}
            >
              {changeText}
            </div>
          </>
        )}
      </div>
    </button>
  )
}

export function WatchlistPanel({
  tickerIds,
  onSelectTicker,
  onAddTicker,
  maxSize,
  className,
}: WatchlistPanelProps) {
  const [addOpen, setAddOpen] = useState(false)
  const isFull = tickerIds.length >= maxSize

  return (
    <Card
      className={cn(
        'relative h-fit overflow-hidden border-border/60 bg-card/80 shadow-lg ring-1 ring-primary/10 lg:flex lg:min-h-0 lg:flex-col',
        className
      )}
    >
      <CardHeader className="relative p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-xl">My watchlist</CardTitle>
            <CardDescription>Quick access to your saved tickers</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isFull}
                aria-label="Add to watchlist"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl p-0 border-0 bg-transparent shadow-none">
              <TickerSearch
                onSelect={(ticker) => {
                  const nextTickerId = ticker.tickerId?.trim().toUpperCase()
                  if (!nextTickerId) return

                  const didAdd = onAddTicker(nextTickerId)
                  if (didAdd) setAddOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      {tickerIds.length === 0 ? (
        <CardContent className="relative p-5 pb-8 pt-0">
          <p className="text-sm text-muted-foreground">
            No tickers yet. Open a stock and add it to your watchlist.
          </p>
        </CardContent>
      ) : (
        <CardContent className="relative p-0 lg:min-h-0 lg:flex-1">
          <div className="divide-y divide-border lg:h-full">
            {tickerIds.map((tickerId) => (
              <WatchlistRow key={tickerId} tickerId={tickerId} onSelect={onSelectTicker} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
