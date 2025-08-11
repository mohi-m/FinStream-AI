export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe?: number;
  dividend?: number;
  high52Week: number;
  low52Week: number;
}

export interface Portfolio {
  id: string;
  stocks: PortfolioStock[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface PortfolioStock {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface ChartData {
  timestamp: string;
  price: number;
}