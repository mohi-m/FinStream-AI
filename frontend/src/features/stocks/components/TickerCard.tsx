import type { KeyboardEventHandler } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useLatestPrice, usePriceHistory } from '../hooks'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface TickerCardProps {
  tickerId: string
  companyName: string
  weeklyPercentChange?: number
  onClick?: () => void
}

export function TickerCard({
  tickerId,
  companyName,
  weeklyPercentChange,
  onClick,
}: TickerCardProps) {
  const { data: price, isLoading: priceLoading } = useLatestPrice(tickerId)

  const trendDays = 30
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

  const weeklyChangeValue = typeof weeklyPercentChange === 'number' ? weeklyPercentChange : null
  const hasWeeklyChange = weeklyChangeValue !== null
  const weeklyChangePositive = !hasWeeklyChange || weeklyChangeValue >= 0
  const weeklyChangeText =
    weeklyChangeValue === null
      ? '--'
      : `${weeklyChangeValue > 0 ? '+' : ''}${formatPercent(weeklyChangeValue)}`
  const positiveTrend = hasWeeklyChange ? weeklyChangePositive : isPositive

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  if (priceLoading) {
    return (
      <Card className="relative h-full overflow-hidden border-border/60 bg-card/80 shadow-md ring-1 ring-primary/10">
        <CardHeader className="relative p-4 pb-2 lg:p-3 lg:pb-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="relative p-4 pt-0 lg:p-3 lg:pt-0">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-16 w-full mt-4 lg:h-12 lg:mt-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="group relative h-full cursor-pointer overflow-hidden border-border/60 bg-card/80 shadow-md ring-1 ring-primary/10 transition-all hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="relative p-4 pb-2 lg:p-3 lg:pb-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base lg:text-sm">{tickerId}</CardTitle>
          {positiveTrend ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 lg:text-xs">{companyName}</p>
      </CardHeader>

      <CardContent className="relative p-4 pt-0 lg:p-3 lg:pt-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tabular-nums lg:text-xl">
            {price?.close ? formatCurrency(price.close) : '--'}
          </span>
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              !hasWeeklyChange
                ? 'text-muted-foreground'
                : weeklyChangePositive
                  ? 'text-green-500'
                  : 'text-red-500'
            )}
          >
            {weeklyChangeText}
          </span>
        </div>

        <div className="h-20 mt-3 lg:h-14 lg:mt-2">
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
                  activeDot={false}
                  connectNulls
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
