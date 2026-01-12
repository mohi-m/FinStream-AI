import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { priceApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { HoldingDto } from '@/lib/api'

interface PortfolioAnalyticsProps {
  holdings: HoldingDto[]
  baseCurrency: string
}

const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export function PortfolioAnalytics({ holdings, baseCurrency }: PortfolioAnalyticsProps) {
  // Fetch latest prices for all holdings
  const priceQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['prices', holding.tickerId, 'latest'],
      queryFn: () => priceApi.getLatest(holding.tickerId),
      enabled: !!holding.tickerId,
    })),
  })

  const isLoading = priceQueries.some((q) => q.isLoading)

  const analytics = useMemo(() => {
    if (isLoading) return null

    const holdingsWithValue = holdings.map((holding, index) => {
      const price = priceQueries[index].data?.close || 0
      const marketValue = price * holding.quantity
      return {
        tickerId: holding.tickerId,
        quantity: holding.quantity,
        price,
        marketValue,
        cashBalance: holding.cashBalance || 0,
      }
    })

    const totalMarketValue = holdingsWithValue.reduce((sum, h) => sum + h.marketValue, 0)
    const totalCashBalance = holdingsWithValue.reduce((sum, h) => sum + h.cashBalance, 0)
    const totalValue = totalMarketValue + totalCashBalance

    const allocationData = holdingsWithValue
      .filter((h) => h.marketValue > 0)
      .map((h) => ({
        name: h.tickerId,
        value: h.marketValue,
        percentage: totalMarketValue > 0 ? (h.marketValue / totalMarketValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)

    return {
      holdingsWithValue,
      totalMarketValue,
      totalCashBalance,
      totalValue,
      allocationData,
    }
  }, [holdings, priceQueries, isLoading])

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Add holdings to see portfolio analytics
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Market Value</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(analytics.totalMarketValue, baseCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cash Balance</p>
              <p className="text-2xl font-bold">
                {formatCurrency(analytics.totalCashBalance, baseCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(analytics.totalValue, baseCurrency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Allocation Chart */}
        {analytics.allocationData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-4">Asset Allocation</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">{formatCurrency(data.value, baseCurrency)}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.percentage.toFixed(1)}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const data = entry.payload as { percentage: number }
                      return `${value} (${data?.percentage?.toFixed(1) || 0}%)`
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Holdings Value Breakdown */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-4">Holdings Breakdown</h4>
          <div className="space-y-2">
            {analytics.holdingsWithValue.map((holding, index) => (
              <div
                key={holding.tickerId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium">{holding.tickerId}</p>
                    <p className="text-sm text-muted-foreground">
                      {holding.quantity} shares @ {formatCurrency(holding.price)}
                    </p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(holding.marketValue, baseCurrency)}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
