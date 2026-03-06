import type { KeyboardEventHandler } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { useLatestPrice, usePriceHistory } from '../hooks'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface IndexTickerCardProps {
  tickerId: string
  companyName: string
  onClick?: () => void
}

export function IndexTickerCard({ tickerId, companyName, onClick }: IndexTickerCardProps) {
  const { data: price, isLoading: priceLoading } = useLatestPrice(tickerId)

  const trendDays = 7
  const trendTo = new Date()
  const trendFrom = new Date(trendTo)
  trendFrom.setDate(trendFrom.getDate() - trendDays)
  const { data: priceHistory, isLoading: historyLoading } = usePriceHistory(tickerId, {
    from: trendFrom.toISOString().split('T')[0],
    to: trendTo.toISOString().split('T')[0],
    size: trendDays,
  })

  const chartData =
    priceHistory?.content
      ?.filter((p) => typeof p.close === 'number')
      ?.slice()
      ?.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      ?.map((p) => ({ close: p.close as number })) || []
  const isPositive =
    chartData.length > 1 &&
    (chartData[chartData.length - 1]?.close || 0) >= (chartData[0]?.close || 0)

  const displayTicker = tickerId.replace(/\^/g, '')

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  if (priceLoading) {
    return (
      <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-lg ring-1 ring-primary/10">
        <CardHeader className="relative p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        </CardHeader>
        <CardContent className="relative p-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-28 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="relative cursor-pointer overflow-hidden border-border/60 bg-card/80 shadow-lg ring-1 ring-primary/10 transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="relative p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-xl truncate">{companyName}</CardTitle>
              <Badge variant="secondary" className="shrink-0 font-mono">
                {displayTicker}
              </Badge>
            </div>
            <CardDescription>Market index snapshot</CardDescription>
          </div>

          {isPositive ? (
            <TrendingUp className="mt-1 h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="mt-1 h-4 w-4 text-red-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="relative p-5 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-end">
          <div className="space-y-1">
            <div className="text-3xl font-semibold tabular-nums">
              {price?.close ? formatCurrency(price.close) : '--'}
            </div>
            <div className="text-sm text-muted-foreground">Last 7 days</div>
          </div>

          <div className="h-28">
            {historyLoading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
