// Generated TypeScript types from OpenAPI spec

// ============ User Types ============
export interface AppUserDto {
  firebaseUid?: string
  email?: string
  fullName: string
  createdAt?: string
  updatedAt?: string
}

// ============ Ticker Types ============
export interface TickerDto {
  tickerId?: string
  companyName?: string
  sector?: string
  industry?: string
  currency?: string
  lastUpdated?: string
}

export interface PageTickerDto {
  totalElements?: number
  totalPages?: number
  size?: number
  content?: TickerDto[]
  number?: number
  sort?: SortObject[]
  first?: boolean
  last?: boolean
  numberOfElements?: number
  pageable?: PageableObject
  empty?: boolean
}

// ============ Price Types ============
export interface PriceDailyDto {
  tickerId?: string
  date?: string
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
}

export interface PagePriceDailyDto {
  totalElements?: number
  totalPages?: number
  size?: number
  content?: PriceDailyDto[]
  number?: number
  sort?: SortObject[]
  first?: boolean
  last?: boolean
  numberOfElements?: number
  pageable?: PageableObject
  empty?: boolean
}

// ============ Financial Types ============
export interface FinancialDto {
  tickerId?: string
  reportDate?: string
  reportType?: string
  totalRevenue?: number
  netIncome?: number
  ebitda?: number
  totalAssets?: number
  totalLiabilities?: number
  totalEquity?: number
  cashAndEquivalents?: number
  operatingCashFlow?: number
  freeCashFlow?: number
}

export interface PageFinancialDto {
  totalElements?: number
  totalPages?: number
  size?: number
  content?: FinancialDto[]
  number?: number
  sort?: SortObject[]
  first?: boolean
  last?: boolean
  numberOfElements?: number
  pageable?: PageableObject
  empty?: boolean
}

// ============ Portfolio Types ============
export interface PortfolioDto {
  portfolioId?: string
  portfolioName: string
  baseCurrency: string
  createdAt?: string
  updatedAt?: string
}

export interface PagePortfolioDto {
  totalElements?: number
  totalPages?: number
  size?: number
  content?: PortfolioDto[]
  number?: number
  sort?: SortObject[]
  first?: boolean
  last?: boolean
  numberOfElements?: number
  pageable?: PageableObject
  empty?: boolean
}

// ============ Holding Types ============
export interface HoldingDto {
  portfolioId?: string
  tickerId: string
  quantity: number
  cashBalance?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface PageHoldingDto {
  totalElements?: number
  totalPages?: number
  size?: number
  content?: HoldingDto[]
  number?: number
  sort?: SortObject[]
  first?: boolean
  last?: boolean
  numberOfElements?: number
  pageable?: PageableObject
  empty?: boolean
}

// ============ Pagination Types ============
export interface Pageable {
  page?: number
  size?: number
  sort?: string[]
}

export interface PageableObject {
  offset?: number
  sort?: SortObject[]
  pageNumber?: number
  pageSize?: number
  paged?: boolean
  unpaged?: boolean
}

export interface SortObject {
  direction?: string
  nullHandling?: string
  ascending?: boolean
  property?: string
  ignoreCase?: boolean
}

// ============ Error Types ============
export interface ErrorResponse {
  status: number
  message: string
  timestamp?: string
}
