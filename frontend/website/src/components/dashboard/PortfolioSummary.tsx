import { FinancialCard } from "@/components/ui/financial-card";
import { TrendingUp, DollarSign, Activity, Target } from "lucide-react";
import { mockPortfolio } from "@/data/mockData";

export function PortfolioSummary() {
  const portfolio = mockPortfolio;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <FinancialCard
        title="Total Portfolio Value"
        value={formatCurrency(portfolio.totalValue)}
        icon={<DollarSign className="h-4 w-4" />}
      />
      
      <FinancialCard
        title="Total Gain/Loss"
        value={formatCurrency(portfolio.totalGainLoss)}
        change={formatPercent(portfolio.totalGainLossPercent)}
        changePercent={portfolio.totalGainLossPercent}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      
      <FinancialCard
        title="Holdings"
        value={portfolio.stocks.length.toString()}
        change="Active positions"
        icon={<Activity className="h-4 w-4" />}
      />
      
      <FinancialCard
        title="Best Performer"
        value="GOOGL"
        change="+12.39%"
        changePercent={12.39}
        icon={<Target className="h-4 w-4" />}
      />
    </div>
  );
}