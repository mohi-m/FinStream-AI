import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  AppUserDto,
  TickerDto,
  PageTickerDto,
  PriceDailyDto,
  PagePriceDailyDto,
  FinancialDto,
  PageFinancialDto,
  PortfolioDto,
  PagePortfolioDto,
  HoldingDto,
  PageHoldingDto,
} from './types'

// ============ User Endpoints ============
export const userApi = {
  getMe: () => apiGet<AppUserDto>('/api/me'),
  
  updateMe: (data: AppUserDto) => apiPut<AppUserDto>('/api/me', data),
}

// ============ Ticker Endpoints ============
export const tickerApi = {
  search: (params: { query?: string; page?: number; size?: number; sort?: string }) =>
    apiGet<PageTickerDto>('/api/tickers', params),
  
  getById: (tickerId: string) => apiGet<TickerDto>(`/api/tickers/${tickerId}`),
}

// ============ Price Endpoints ============
export const priceApi = {
  getHistory: (tickerId: string, params?: { from?: string; to?: string; page?: number; size?: number }) =>
    apiGet<PagePriceDailyDto>(`/api/tickers/${tickerId}/prices`, params),
  
  getLatest: (tickerId: string) => apiGet<PriceDailyDto>(`/api/tickers/${tickerId}/prices/latest`),
}

// ============ Financial Endpoints ============
export const financialApi = {
  getHistory: (
    tickerId: string,
    params?: { reportType?: 'annual' | 'quarterly'; from?: string; to?: string; page?: number; size?: number }
  ) => apiGet<PageFinancialDto>(`/api/tickers/${tickerId}/financials`, params),
  
  getLatest: (tickerId: string, reportType: 'annual' | 'quarterly' = 'annual') =>
    apiGet<FinancialDto>(`/api/tickers/${tickerId}/financials/latest`, { reportType }),
}

// ============ Portfolio Endpoints ============
export const portfolioApi = {
  getAll: (params?: { page?: number; size?: number; sort?: string }) =>
    
    apiGet<PagePortfolioDto>('/api/portfolios', params),
  getById: (portfolioId: string) => apiGet<PortfolioDto>(`/api/portfolios/${portfolioId}`),
  
  create: (data: PortfolioDto) => apiPost<PortfolioDto>('/api/portfolios', data),
  
  update: (portfolioId: string, data: PortfolioDto) =>
    apiPut<PortfolioDto>(`/api/portfolios/${portfolioId}`, data),
  
  delete: (portfolioId: string) => apiDelete(`/api/portfolios/${portfolioId}`),
}

// ============ Holding Endpoints ============
export const holdingApi = {
  getAll: (portfolioId: string, params?: { page?: number; size?: number; sort?: string }) =>
    apiGet<PageHoldingDto>(`/api/portfolios/${portfolioId}/holdings`, params),
  
  create: (portfolioId: string, data: HoldingDto) =>
    apiPost<HoldingDto>(`/api/portfolios/${portfolioId}/holdings`, data),
  
  update: (portfolioId: string, tickerId: string, data: HoldingDto) =>
    apiPut<HoldingDto>(`/api/portfolios/${portfolioId}/holdings/${tickerId}`, data),
  
  delete: (portfolioId: string, tickerId: string) =>
    apiDelete(`/api/portfolios/${portfolioId}/holdings/${tickerId}`),
}
