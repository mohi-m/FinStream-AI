import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { priceApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { HoldingDto } from '@/lib/api'

interface PortfolioAnalyticsProps {
  holdings: HoldingDto[]
  baseCurrency: string
}

export function PortfolioAnalytics({ holdings, baseCurrency }: PortfolioAnalyticsProps) {
  const priceQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['prices', holding.tickerId, 'latest'],
      queryFn: () => priceApi.getLatest(holding.tickerId),
      enabled: !!holding.tickerId,
    })),
  })

  const isLoading = priceQueries.some((query) => query.isLoading)

  const analytics = useMemo(() => {
    if (isLoading) {
      return null
    }

    const rows = holdings.map((holding, index) => {
      const quantity = Number(holding.quantity || 0)
      const investedAmount = Number(holding.investedAmount || 0)
      const price = Number(priceQueries[index].data?.close || 0)
      const marketValue = quantity * price

      return {
        tickerId: holding.tickerId,
        quantity,
        investedAmount,
        marketValue,
      }
    })

    const totalMarketValue = rows.reduce((sum, row) => sum + row.marketValue, 0)
    const totalInvestedAmount = rows.reduce((sum, row) => sum + row.investedAmount, 0)
    const profitLoss = totalMarketValue - totalInvestedAmount

    return {
      rows,
      totalMarketValue,
      totalInvestedAmount,
      profitLoss,
    }
  }, [holdings, isLoading, priceQueries])

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
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
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-56" />
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  const profitLossClassName =
    analytics.profitLoss > 0
      ? 'text-green-600'
      : analytics.profitLoss < 0
        ? 'text-red-600'
        : 'text-foreground'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <p className="text-sm text-muted-foreground">Invested Amount</p>
              <p className="text-2xl font-bold">
                {formatCurrency(analytics.totalInvestedAmount, baseCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Profit / Loss</p>
              <p className={`text-2xl font-bold ${profitLossClassName}`}>
                {formatCurrency(analytics.profitLoss, baseCurrency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-medium">Holdings</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Invested Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.rows.map((row) => (
                <TableRow key={row.tickerId}>
                  <TableCell className="font-medium">{row.tickerId}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.investedAmount, baseCurrency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
