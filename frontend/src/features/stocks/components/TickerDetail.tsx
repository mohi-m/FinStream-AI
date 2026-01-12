import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Badge,
  Skeleton,
  Button,
} from '@/components/ui'
import {
  useTicker,
  useLatestPrice,
  usePriceHistory,
  useLatestFinancial,
  useFinancialHistory,
} from '../hooks'
import { useWatchlist } from '../hooks/useWatchlist'
import { formatCurrency, formatCompactNumber, getDateRange, formatDate } from '@/lib/utils'
import { Star, StarOff, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { toast } from 'sonner'

interface TickerDetailProps {
  tickerId: string
  onBack: () => void
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'MAX'

export function TickerDetail({ tickerId, onBack }: TickerDetailProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M')
  const [reportType, setReportType] = useState<'annual' | 'quarterly'>('annual')

  const { data: ticker, isLoading: tickerLoading } = useTicker(tickerId)
  const { data: latestPrice, isLoading: priceLoading } = useLatestPrice(tickerId)
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, maxSize } = useWatchlist()

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange])
  const { data: priceHistory, isLoading: historyLoading } = usePriceHistory(tickerId, {
    from: dateRange.from,
    to: dateRange.to,
    size: 365,
  })

  const { data: latestFinancial } = useLatestFinancial(tickerId, reportType)
  const { data: financials } = useFinancialHistory(tickerId, { reportType, size: 10 })

  const chartData = useMemo(() => {
    if (!priceHistory?.content) return []
    return [...priceHistory.content]
      .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
      .map((p) => ({
        date: p.date,
        close: p.close,
        high: p.high,
        low: p.low,
        volume: p.volume,
      }))
  }, [priceHistory])

  const isPositive =
    chartData.length > 1 &&
    (chartData[chartData.length - 1]?.close || 0) >= (chartData[0]?.close || 0)

  const handleWatchlistToggle = () => {
    if (isInWatchlist(tickerId)) {
      removeFromWatchlist(tickerId)
      toast.success('Removed from watchlist')
    } else {
      if (watchlist.length >= maxSize) {
        toast.error(`Watchlist is full (max ${maxSize} items)`)
        return
      }
      addToWatchlist(tickerId)
      toast.success('Added to watchlist')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            {tickerLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-48 mt-2" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {tickerId}
                  {isPositive ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </h1>
                <p className="text-muted-foreground">{ticker?.companyName}</p>
              </>
            )}
          </div>
        </div>
        <Button
          variant={isInWatchlist(tickerId) ? 'secondary' : 'outline'}
          onClick={handleWatchlistToggle}
        >
          {isInWatchlist(tickerId) ? (
            <>
              <StarOff className="h-4 w-4 mr-2" />
              Remove from Watchlist
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-2" />
              Add to Watchlist
            </>
          )}
        </Button>
      </div>

      {/* Price & Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-4xl">
                  {priceLoading ? (
                    <Skeleton className="h-10 w-32" />
                  ) : (
                    formatCurrency(latestPrice?.close || 0)
                  )}
                </CardTitle>
                {latestPrice?.date && (
                  <CardDescription>Last updated: {formatDate(latestPrice.date)}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                {(['1M', '3M', '6M', '1Y', 'MAX'] as TimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {historyLoading ? (
                <Skeleton className="h-full w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isPositive ? '#22c55e' : '#ef4444'}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={isPositive ? '#22c55e' : '#ef4444'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                      className="text-xs"
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value}`}
                      className="text-xs"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="text-sm font-medium">{formatDate(data.date)}</p>
                              <p className="text-sm">Close: {formatCurrency(data.close)}</p>
                              <p className="text-xs text-muted-foreground">
                                H: {formatCurrency(data.high)} / L: {formatCurrency(data.low)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No price data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickerLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <Badge variant="secondary">{ticker?.sector || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{ticker?.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{ticker?.currency || 'USD'}</p>
                </div>
                {latestPrice && (
                  <>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Today's Range</p>
                      <p className="font-medium">
                        {formatCurrency(latestPrice.low || 0)} -{' '}
                        {formatCurrency(latestPrice.high || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Volume</p>
                      <p className="font-medium">{formatCompactNumber(latestPrice.volume || 0)}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financials</CardTitle>
            <Tabs
              value={reportType}
              onValueChange={(v) => setReportType(v as 'annual' | 'quarterly')}
            >
              <TabsList>
                <TabsTrigger value="annual">Annual</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {latestFinancial ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.totalRevenue || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.netIncome || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.totalAssets || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.totalLiabilities || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Equity</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.totalEquity || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EBITDA</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.ebitda || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Cash Flow</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.freeCashFlow || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash & Equivalents</p>
                <p className="text-xl font-bold">
                  {formatCompactNumber(latestFinancial.cashAndEquivalents || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No financial data available
            </div>
          )}

          {/* Financial History Chart */}
          {financials?.content && financials.content.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium mb-4">Revenue & Net Income Trend</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...financials.content]
                      .sort(
                        (a, b) =>
                          new Date(a.reportDate || '').getTime() -
                          new Date(b.reportDate || '').getTime()
                      )
                      .map((f) => ({
                        date: f.reportDate,
                        revenue: f.totalRevenue,
                        netIncome: f.netIncome,
                      }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getFullYear()}`
                      }}
                    />
                    <YAxis tickFormatter={(value) => formatCompactNumber(value)} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="text-sm font-medium">
                                {formatDate(payload[0].payload.date)}
                              </p>
                              <p className="text-sm text-blue-500">
                                Revenue: {formatCompactNumber(payload[0].payload.revenue)}
                              </p>
                              <p className="text-sm text-green-500">
                                Net Income: {formatCompactNumber(payload[0].payload.netIncome)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="netIncome"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
