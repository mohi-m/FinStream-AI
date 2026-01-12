import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useLatestPrice, usePriceHistory } from '../hooks'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

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

  if (priceLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-16 w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tickerId}</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{companyName}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {price?.close ? formatCurrency(price.close) : '--'}
          </span>
        </div>
        <div className="h-16 mt-4">
          {historyLoading ? (
            <Skeleton className="h-full w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? '#22c55e' : '#ef4444'}
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
