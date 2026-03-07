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
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface IndexTickerCardProps {
  tickerId: string
  companyName: string
  onClick?: () => void
}

export function IndexTickerCard({ tickerId, companyName, onClick }: IndexTickerCardProps) {
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

  const historyRows =
    priceHistory?.content
      ?.filter((p) => typeof p.close === 'number')
      ?.slice()
      ?.sort((a, b) => (a.date || '').localeCompare(b.date || '')) || []

  const chartData = historyRows.map((p) => ({ close: p.close as number }))

  const latestHistoryDateRaw = historyRows[historyRows.length - 1]?.date
  const latestHistoryDate = latestHistoryDateRaw ? new Date(`${latestHistoryDateRaw}T00:00:00`) : null
  const weeklyWindowStart = latestHistoryDate ? new Date(latestHistoryDate) : null
  weeklyWindowStart?.setDate(weeklyWindowStart.getDate() - 7)
  weeklyWindowStart?.setHours(0, 0, 0, 0)

  const weeklyBaselineClose =
    historyRows.find((row) => {
      if (!latestHistoryDate || !weeklyWindowStart || !row.date || typeof row.close !== 'number') {
        return false
      }

      const rowDate = new Date(`${row.date}T00:00:00`)
      return rowDate >= weeklyWindowStart && rowDate < latestHistoryDate
    })?.close ?? (historyRows.length > 1 ? historyRows[0]?.close : null)

  const latestClose = historyRows[historyRows.length - 1]?.close
  const weeklyChangeValue =
    typeof weeklyBaselineClose === 'number' &&
    typeof latestClose === 'number' &&
    weeklyBaselineClose !== 0
      ? ((latestClose - weeklyBaselineClose) / weeklyBaselineClose) * 100
      : null
  const hasWeeklyChange = weeklyChangeValue !== null
  const weeklyChangePositive = !hasWeeklyChange || weeklyChangeValue >= 0
  const weeklyChangeText =
    weeklyChangeValue === null ? '--' : `${weeklyChangeValue > 0 ? '+' : ''}${formatPercent(weeklyChangeValue)}`

  const isPositive =
    chartData.length > 1 &&
    (chartData[chartData.length - 1]?.close || 0) >= (chartData[0]?.close || 0)
  const positiveTrend = hasWeeklyChange ? weeklyChangePositive : isPositive

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
        <CardHeader className="relative p-5 pb-3 lg:p-4 lg:pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        </CardHeader>
        <CardContent className="relative p-5 pt-0 lg:p-4 lg:pt-0">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-32 w-full lg:h-24" />
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
      <CardHeader className="relative p-5 pb-3 lg:p-4 lg:pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-xl truncate lg:text-lg">{companyName}</CardTitle>
              <Badge variant="secondary" className="shrink-0 font-mono">
                {displayTicker}
              </Badge>
            </div>
            <CardDescription>Market index snapshot</CardDescription>
          </div>

          {positiveTrend ? (
            <TrendingUp className="mt-1 h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="mt-1 h-4 w-4 text-red-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="relative p-5 pt-0 lg:p-4 lg:pt-0">
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold tabular-nums lg:text-2xl">
              {price?.close ? formatCurrency(price.close) : '--'}
            </div>
            <div
              className={cn(
                'text-sm font-medium tabular-nums',
                !hasWeeklyChange
                  ? 'text-muted-foreground'
                  : weeklyChangePositive
                    ? 'text-green-500'
                    : 'text-red-500'
              )}
            >
              {weeklyChangeText}
            </div>
          </div>

          <div className="h-32 lg:h-24">
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
        </div>
      </CardContent>
    </Card>
  )
}
