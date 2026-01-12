import { useState } from 'react'
import { Input, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { useTickersSearch } from '../hooks'
import { Search } from 'lucide-react'
import { useDebounce } from '@/lib/utils/hooks'
import type { TickerDto } from '@/lib/api'

interface TickerSearchProps {
  onSelect: (ticker: TickerDto) => void
}

export function TickerSearch({ onSelect }: TickerSearchProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading, isFetching } = useTickersSearch(debouncedQuery, 0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Tickers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Sector</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.content.map((ticker) => (
                      <TableRow
                        key={ticker.tickerId}
                        className="cursor-pointer"
                        onClick={() => ticker.tickerId && onSelect(ticker)}
                      >
                        <TableCell className="font-medium">{ticker.tickerId}</TableCell>
                        <TableCell>{ticker.companyName}</TableCell>
                        <TableCell>
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
    </Card>
  )
}
