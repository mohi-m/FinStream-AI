import { useState } from 'react'
import { Input, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { useTickersSearch } from '../hooks'
import { Search } from 'lucide-react'
import { useDebounce } from '@/lib/utils/hooks'
import { cn } from '@/lib/utils'
import type { TickerDto } from '@/lib/api'

interface TickerSearchProps {
  onSelect: (ticker: TickerDto) => void
  embedded?: boolean
  inputId?: string
  className?: string
}

export function TickerSearch({
  onSelect,
  embedded = false,
  inputId,
  className,
}: TickerSearchProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading, isFetching } = useTickersSearch(debouncedQuery, 0, 10)

  const searchBody = (
    <>
      {!embedded && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Tickers
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(embedded && 'p-0')}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={inputId}
            placeholder="Search by ticker or company name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {debouncedQuery && (
          <div className="mt-4">
            {isLoading || isFetching ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.content && data.content.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-130">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="hidden sm:table-cell">Sector</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.content.map((ticker) => (
                      <TableRow
                        key={ticker.tickerId}
                        className="cursor-pointer"
                        onClick={() => ticker.tickerId && onSelect(ticker)}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {ticker.tickerId}
                        </TableCell>
                        <TableCell className="max-w-55 truncate">{ticker.companyName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{ticker.sector || 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tickers found for "{debouncedQuery}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </>
  )

  if (embedded) {
    return <div className={className}>{searchBody}</div>
  }

  return <Card className={className}>{searchBody}</Card>
}
