import { useQueries } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui'
import { priceApi } from '@/lib/api'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import type { HoldingDto } from '@/lib/api'

interface PortfolioSummaryCardsProps {
  holdings: HoldingDto[]
  baseCurrency: string
  isLoading?: boolean
  className?: string
}

export function PortfolioSummaryCards({
  holdings,
  baseCurrency,
  isLoading = false,
  className,
}: PortfolioSummaryCardsProps) {
  const priceQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['prices', holding.tickerId, 'latest'],
      queryFn: () => priceApi.getLatest(holding.tickerId),
      enabled: !!holding.tickerId,
    })),
  })

  const hasPriceLoading = priceQueries.some((query) => query.isLoading)
  const showLoading = isLoading || (holdings.length > 0 && hasPriceLoading)

  if (showLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-3', className)}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-20" />
        ))}
      </div>
    )
  }

  const summary = holdings.reduce(
    (acc, holding, index) => {
      const quantity = Number(holding.quantity || 0)
      const investedAmount = Number(holding.investedAmount || 0)
      const latestPrice = Number(priceQueries[index]?.data?.close || 0)

      acc.totalInvestedAmount += investedAmount
      acc.totalMarketValue += quantity * latestPrice

      return acc
    },
    {
      totalMarketValue: 0,
      totalInvestedAmount: 0,
    }
  )

  const profitLoss = summary.totalMarketValue - summary.totalInvestedAmount
  const profitLossPercent =
    summary.totalInvestedAmount > 0 ? (profitLoss / summary.totalInvestedAmount) * 100 : 0

  const profitLossClassName =
    profitLoss > 0 ? 'text-green-600' : profitLoss < 0 ? 'text-red-600' : 'text-foreground'

  return (
    <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-3', className)}>
      <div className="rounded-lg border bg-muted/30 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Market Value</p>
        <p className="text-xl font-semibold text-primary">
          {formatCurrency(summary.totalMarketValue, baseCurrency)}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Invested</p>
        <p className="text-xl font-semibold">
          {formatCurrency(summary.totalInvestedAmount, baseCurrency)}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Net PnL</p>
        <p className={`text-xl font-semibold ${profitLossClassName}`}>
          {formatCurrency(profitLoss, baseCurrency)}
        </p>
        <p className={`text-xs ${profitLossClassName}`}>
          {formatPercent(profitLossPercent)} overall return
        </p>
      </div>
    </div>
  )
}
