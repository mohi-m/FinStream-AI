import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { priceApi, tickerApi } from '@/lib/api'
import { cn, formatCompactNumber, formatCurrency, formatPercent } from '@/lib/utils'
import type { HoldingDto } from '@/lib/api'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface PortfolioAnalyticsProps {
  holdings: HoldingDto[]
  baseCurrency: string
  className?: string
}

interface StockAnalyticsRow {
  tickerId: string
  sector: string
  quantity: number
  investedAmount: number
  marketValue: number
  profitLoss: number
}

interface SectorAnalyticsRow {
  sector: string
  investedAmount: number
  marketValue: number
  profitLoss: number
}

interface SectorChartRow extends SectorAnalyticsRow {
  allocationPct: number
}

const MODERN_COLORS = {
  sectorInvestedStart: '#fde68a',
  sectorInvestedEnd: '#d97706',
  sectorMarketStart: '#93c5fd',
  sectorMarketEnd: '#2563eb',
  stockInvestedStart: '#fde68a',
  stockInvestedEnd: '#d97706',
  stockMarketStart: '#93c5fd',
  stockMarketEnd: '#2563eb',
  pnlPositive: '#10b981',
  pnlNegative: '#f43f5e',
}

const TOOLTIP_STYLE = {
  borderRadius: '0.65rem',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
}

const TOOLTIP_LABEL_STYLE = {
  color: 'hsl(var(--popover-foreground))',
  fontWeight: 600,
}

const TOOLTIP_ITEM_STYLE = {
  color: 'hsl(var(--popover-foreground))',
}

function collapseSectors(rows: SectorAnalyticsRow[], limit = 4): SectorAnalyticsRow[] {
  if (rows.length <= limit) {
    return rows
  }

  const topRows = rows.slice(0, limit)
  const remainingRows = rows.slice(limit)

  const others = remainingRows.reduce<SectorAnalyticsRow>(
    (acc, row) => ({
      sector: 'Other',
      investedAmount: acc.investedAmount + row.investedAmount,
      marketValue: acc.marketValue + row.marketValue,
      profitLoss: acc.profitLoss + row.profitLoss,
    }),
    {
      sector: 'Other',
      investedAmount: 0,
      marketValue: 0,
      profitLoss: 0,
    }
  )

  return [...topRows, others]
}

function collapseStocks(rows: StockAnalyticsRow[], limit = 8): StockAnalyticsRow[] {
  if (rows.length <= limit) {
    return rows
  }

  const topRows = rows.slice(0, limit)
  const remainingRows = rows.slice(limit)

  const others = remainingRows.reduce<StockAnalyticsRow>(
    (acc, row) => ({
      tickerId: 'OTHER',
      sector: 'Mixed',
      quantity: acc.quantity + row.quantity,
      investedAmount: acc.investedAmount + row.investedAmount,
      marketValue: acc.marketValue + row.marketValue,
      profitLoss: acc.profitLoss + row.profitLoss,
    }),
    {
      tickerId: 'OTHER',
      sector: 'Mixed',
      quantity: 0,
      investedAmount: 0,
      marketValue: 0,
      profitLoss: 0,
    }
  )

  return [...topRows, others]
}

const SECTOR_TICK_MAX_CHARS = 14
const SECTOR_TICK_LINE_HEIGHT = 13
const SECTOR_TICK_Y_OFFSET = 18
const SECTOR_XAXIS_TICK_MARGIN = 10

function splitLongToken(token: string, maxCharsPerLine: number): string[] {
  if (token.length <= maxCharsPerLine) {
    return [token]
  }

  const chunks: string[] = []
  for (let start = 0; start < token.length; start += maxCharsPerLine) {
    chunks.push(token.slice(start, start + maxCharsPerLine))
  }
  return chunks
}

function wrapSectorTickLabel(label: string): string[] {
  const normalizedLabel = label.trim()
  if (!normalizedLabel) {
    return ['-']
  }

  const tokens = normalizedLabel
    .split(/\s+/)
    .flatMap((token) => splitLongToken(token, SECTOR_TICK_MAX_CHARS))

  const lines: string[] = []
  let currentLine = ''

  tokens.forEach((token) => {
    const nextLine = currentLine ? `${currentLine} ${token}` : token
    if (nextLine.length <= SECTOR_TICK_MAX_CHARS) {
      currentLine = nextLine
      return
    }

    if (currentLine) {
      lines.push(currentLine)
    }
    currentLine = token
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function renderWrappedSectorTick(props: {
  x?: number
  y?: number
  payload?: { value?: string | number }
}) {
  const { x = 0, y = 0, payload } = props
  const label = String(payload?.value ?? '')
  const lines = wrapSectorTickLabel(label)

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={SECTOR_TICK_Y_OFFSET}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={12}
      >
        {lines.map((line, index) => (
          <tspan key={`${label}-${index}`} x={0} dy={index === 0 ? 0 : SECTOR_TICK_LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

export function PortfolioAnalytics({ holdings, baseCurrency, className }: PortfolioAnalyticsProps) {
  const priceQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['prices', holding.tickerId, 'latest'],
      queryFn: () => priceApi.getLatest(holding.tickerId),
      enabled: !!holding.tickerId,
    })),
  })

  const tickerQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['tickers', holding.tickerId],
      queryFn: () => tickerApi.getById(holding.tickerId),
      enabled: !!holding.tickerId,
    })),
  })

  const isLoading =
    priceQueries.some((query) => query.isLoading) || tickerQueries.some((query) => query.isLoading)

  const analytics = useMemo(() => {
    if (isLoading) {
      return null
    }

    const rows: StockAnalyticsRow[] = holdings.map((holding, index) => {
      const quantity = Number(holding.quantity || 0)
      const investedAmount = Number(holding.investedAmount || 0)
      const price = Number(priceQueries[index].data?.close || 0)
      const marketValue = quantity * price
      const profitLoss = marketValue - investedAmount
      const sector = tickerQueries[index].data?.sector?.trim() || 'Unknown'

      return {
        tickerId: holding.tickerId,
        sector,
        quantity,
        investedAmount,
        marketValue,
        profitLoss,
      }
    })

    const sortedStockRows = [...rows].sort((a, b) => b.marketValue - a.marketValue)
    const totalMarketValue = rows.reduce((sum, row) => sum + row.marketValue, 0)

    const sectorMap = new Map<string, SectorAnalyticsRow>()
    rows.forEach((row) => {
      const existing = sectorMap.get(row.sector)
      if (existing) {
        sectorMap.set(row.sector, {
          sector: row.sector,
          investedAmount: existing.investedAmount + row.investedAmount,
          marketValue: existing.marketValue + row.marketValue,
          profitLoss: existing.profitLoss + row.profitLoss,
        })
        return
      }

      sectorMap.set(row.sector, {
        sector: row.sector,
        investedAmount: row.investedAmount,
        marketValue: row.marketValue,
        profitLoss: row.profitLoss,
      })
    })

    const sortedSectorRows = [...sectorMap.values()].sort((a, b) => b.marketValue - a.marketValue)
    const sectorChartRows: SectorChartRow[] = collapseSectors(sortedSectorRows).map((row) => ({
      ...row,
      allocationPct: totalMarketValue > 0 ? (row.marketValue / totalMarketValue) * 100 : 0,
    }))

    const topSector = [...sortedSectorRows].sort((a, b) => b.profitLoss - a.profitLoss)[0] || null
    const bottomSector =
      [...sortedSectorRows].sort((a, b) => a.profitLoss - b.profitLoss)[0] || null

    const stockChartRows = collapseStocks(sortedStockRows)

    const topGainer = [...sortedStockRows].sort((a, b) => b.profitLoss - a.profitLoss)[0] || null
    const topLoser = [...sortedStockRows].sort((a, b) => a.profitLoss - b.profitLoss)[0] || null

    return {
      sectorChartRows,
      topSector,
      bottomSector,
      stockChartRows,
      topGainer,
      topLoser,
    }
  }, [holdings, isLoading, priceQueries, tickerQueries])

  if (holdings.length === 0) {
    return (
      <Card className={className}>
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72" />
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  const sectorTickLineCount = Math.max(
    1,
    ...analytics.sectorChartRows.map((row) => wrapSectorTickLabel(row.sector).length)
  )
  const sectorXAxisHeight =
    SECTOR_TICK_Y_OFFSET + 8 + (sectorTickLineCount - 1) * SECTOR_TICK_LINE_HEIGHT

  const formatTooltipCurrency = (value: number | string | undefined) =>
    formatCurrency(Number(value ?? 0), baseCurrency)

  const renderSectorTooltip = (tooltipProps: unknown) => {
    const { active, payload } = (tooltipProps ?? {}) as {
      active?: boolean
      payload?: ReadonlyArray<{ payload: SectorChartRow }>
    }

    const row = payload?.[0]?.payload
    if (!active || !row) {
      return null
    }

    return (
      <div className="min-w-52" style={TOOLTIP_STYLE}>
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-semibold text-foreground">{row.sector}</p>
        </div>
        <div className="space-y-1.5 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Allocation</span>
            <span className="font-medium text-foreground">{formatPercent(row.allocationPct)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Invested</span>
            <span className="font-medium text-foreground">
              {formatCurrency(row.investedAmount, baseCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Market Value</span>
            <span className="font-medium text-foreground">
              {formatCurrency(row.marketValue, baseCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">PnL</span>
            <span
              className={cn('font-medium', row.profitLoss >= 0 ? 'text-green-600' : 'text-red-600')}
            >
              {formatCurrency(row.profitLoss, baseCurrency)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('flex h-full min-h-120 flex-col overflow-hidden', className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-5">
        <Tabs defaultValue="sector" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-auto flex h-auto w-fit rounded-full border border-border/70 bg-muted/40 p-1">
            <TabsTrigger
              value="sector"
              className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              By Sector
            </TabsTrigger>
            <TabsTrigger
              value="stocks"
              className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              By Stocks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sector" className="mt-3 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <Card className="flex h-full min-h-0 flex-col">
                <CardContent className="flex min-h-0 flex-1 flex-col gap-5 pt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-md border bg-muted/30 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Top Performing Sector
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {analytics.topSector?.sector || '-'}
                      </p>
                      <p className="text-xs text-green-600">
                        {analytics.topSector
                          ? formatCurrency(analytics.topSector.profitLoss, baseCurrency)
                          : '-'}
                      </p>
                    </div>

                    <div className="rounded-md border bg-muted/30 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Bottom Performing Sector
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {analytics.bottomSector?.sector || '-'}
                      </p>
                      <p className="text-xs text-red-600">
                        {analytics.bottomSector
                          ? formatCurrency(analytics.bottomSector.profitLoss, baseCurrency)
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Investment vs Market Value
                    </p>
                  </div>

                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.sectorChartRows}
                        margin={{ top: 8, right: 16, left: 4, bottom: 12 }}
                      >
                        <defs>
                          <linearGradient id="sectorInvestedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={MODERN_COLORS.sectorInvestedStart} />
                            <stop offset="100%" stopColor={MODERN_COLORS.sectorInvestedEnd} />
                          </linearGradient>
                          <linearGradient id="sectorMarketGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={MODERN_COLORS.sectorMarketStart} />
                            <stop offset="100%" stopColor={MODERN_COLORS.sectorMarketEnd} />
                          </linearGradient>
                        </defs>

                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ paddingBottom: '0.5rem' }}
                          formatter={(value) => (
                            <span className="text-xs font-medium text-muted-foreground">
                              {value}
                            </span>
                          )}
                        />

                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="sector"
                          tick={renderWrappedSectorTick}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={SECTOR_XAXIS_TICK_MARGIN}
                          interval={0}
                          height={sectorXAxisHeight}
                        />
                        <YAxis
                          width={64}
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => formatCompactNumber(Number(value))}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={renderSectorTooltip}
                          cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="investedAmount"
                          name="Invested"
                          fill="url(#sectorInvestedGradient)"
                          radius={[8, 8, 0, 0]}
                          barSize={20}
                          isAnimationActive={true}
                        />
                        <Bar
                          dataKey="marketValue"
                          name="Market Value"
                          fill="url(#sectorMarketGradient)"
                          radius={[8, 8, 0, 0]}
                          barSize={20}
                          isAnimationActive={true}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stocks" className="mt-3 flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-5">
              <Card className="lg:col-span-3 flex min-h-0 flex-col">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">Stock Value Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.stockChartRows}
                      margin={{ top: 8, right: 8, left: 4, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="stockInvestedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MODERN_COLORS.stockInvestedStart} />
                          <stop offset="100%" stopColor={MODERN_COLORS.stockInvestedEnd} />
                        </linearGradient>
                        <linearGradient id="stockMarketGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={MODERN_COLORS.stockMarketStart} />
                          <stop offset="100%" stopColor={MODERN_COLORS.stockMarketEnd} />
                        </linearGradient>
                      </defs>

                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingBottom: '0.5rem' }}
                        formatter={(value) => (
                          <span className="text-xs font-medium text-muted-foreground">{value}</span>
                        )}
                      />

                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="tickerId"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        interval={0}
                        height={40}
                      />
                      <YAxis
                        width={64}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => formatCompactNumber(Number(value))}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={formatTooltipCurrency}
                        cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        itemStyle={TOOLTIP_ITEM_STYLE}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="investedAmount"
                        name="Invested"
                        fill="url(#stockInvestedGradient)"
                        radius={[8, 8, 0, 0]}
                        barSize={18}
                        isAnimationActive={true}
                      />
                      <Bar
                        dataKey="marketValue"
                        name="Market Value"
                        fill="url(#stockMarketGradient)"
                        radius={[8, 8, 0, 0]}
                        barSize={18}
                        isAnimationActive={true}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 flex min-h-0 flex-col">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">PnL by Stock</CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.stockChartRows}
                        layout="vertical"
                        margin={{ top: 8, right: 8, left: 0, bottom: 6 }}
                      >
                        {' '}
                        <CartesianGrid
                          strokeDasharray="4 4"
                          horizontal={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => formatCompactNumber(Number(value))}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          type="category"
                          dataKey="tickerId"
                          width={56}
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={formatTooltipCurrency}
                          cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                          contentStyle={TOOLTIP_STYLE}
                          labelStyle={TOOLTIP_LABEL_STYLE}
                          itemStyle={TOOLTIP_ITEM_STYLE}
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="profitLoss"
                          name="PnL"
                          radius={[0, 4, 4, 0]}
                          isAnimationActive={true}
                        >
                          {analytics.stockChartRows.map((stock) => (
                            <Cell
                              key={stock.tickerId}
                              fill={
                                stock.profitLoss >= 0
                                  ? MODERN_COLORS.pnlPositive
                                  : MODERN_COLORS.pnlNegative
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-md border bg-muted/30 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Top Gainer
                      </p>
                      <p className="text-sm font-semibold">
                        {analytics.topGainer?.tickerId || '-'}
                      </p>
                      <p className="text-xs text-green-600">
                        {analytics.topGainer
                          ? formatCurrency(analytics.topGainer.profitLoss, baseCurrency)
                          : '-'}
                      </p>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Top Loser
                      </p>
                      <p className="text-sm font-semibold">{analytics.topLoser?.tickerId || '-'}</p>
                      <p className="text-xs text-red-600">
                        {analytics.topLoser
                          ? formatCurrency(analytics.topLoser.profitLoss, baseCurrency)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
