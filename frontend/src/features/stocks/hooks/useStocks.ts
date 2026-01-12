import { useQuery } from '@tanstack/react-query'
import { tickerApi, priceApi, financialApi } from '@/lib/api'

export function useTickersSearch(query: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['tickers', 'search', query, page, size],
    queryFn: () => tickerApi.search({ query, page, size }),
    enabled: query.length > 0,
  })
}

export function useTicker(tickerId: string) {
  return useQuery({
    queryKey: ['tickers', tickerId],
    queryFn: () => tickerApi.getById(tickerId),
    enabled: !!tickerId,
  })
}

export function useLatestPrice(tickerId: string) {
  return useQuery({
    queryKey: ['prices', tickerId, 'latest'],
    queryFn: () => priceApi.getLatest(tickerId),
    enabled: !!tickerId,
    staleTime: 1000 * 60, // 1 minute
  })
}

export function usePriceHistory(
  tickerId: string,
  params?: { from?: string; to?: string; page?: number; size?: number }
) {
  return useQuery({
    queryKey: ['prices', tickerId, 'history', params],
    queryFn: () => priceApi.getHistory(tickerId, params),
    enabled: !!tickerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useLatestFinancial(tickerId: string, reportType: 'annual' | 'quarterly' = 'annual') {
  return useQuery({
    queryKey: ['financials', tickerId, 'latest', reportType],
    queryFn: () => financialApi.getLatest(tickerId, reportType),
    enabled: !!tickerId,
  })
}

export function useFinancialHistory(
  tickerId: string,
  params?: { reportType?: 'annual' | 'quarterly'; from?: string; to?: string; page?: number; size?: number }
) {
  return useQuery({
    queryKey: ['financials', tickerId, 'history', params],
    queryFn: () => financialApi.getHistory(tickerId, params),
    enabled: !!tickerId,
  })
}
