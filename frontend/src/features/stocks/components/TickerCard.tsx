import type { KeyboardEventHandler } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useLatestPrice, usePriceHistory } from '../hooks'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface TickerCardProps {
  tickerId: string
  companyName: string
  onClick?: () => void
}

export function TickerCard({ tickerId, companyName, onClick }: TickerCardProps) {
  const { data: price, isLoading: priceLoading } = useLatestPrice(tickerId)

  // Get 30-day price history for sparkline
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: priceHistory, isLoading: historyLoading } = usePriceHistory(tickerId, {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    size: 30,
  })

  const chartData = priceHistory?.content?.map((p) => ({ close: p.close })) || []
  const isPositive =
    chartData.length > 1 &&
    (chartData[chartData.length - 1]?.close || 0) >= (chartData[0]?.close || 0)

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  if (priceLoading) {
    return (
      <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-md ring-1 ring-primary/10">
        <CardHeader className="relative p-4 pb-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="relative p-4 pt-0">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-16 w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border/60 bg-card/80 shadow-md ring-1 ring-primary/10 transition-all hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="relative p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{tickerId}</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{companyName}</p>
      </CardHeader>

      <CardContent className="relative p-4 pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {price?.close ? formatCurrency(price.close) : '--'}
          </span>
        </div>

        <div className="h-16 mt-4">
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
      </CardContent>
    </Card>
  )
}
