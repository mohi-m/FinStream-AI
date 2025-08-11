import { PortfolioSummary } from "./PortfolioSummary";
import { StockList } from "./StockList";
import { PortfolioHoldings } from "./PortfolioHoldings";
import { MarketOverview } from "./MarketOverview";

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <PortfolioSummary />
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Portfolio Holdings */}
        <div className="lg:col-span-2">
          <PortfolioHoldings />
        </div>
        
        {/* Right Column - Market Overview */}
        <div>
          <MarketOverview />
        </div>
      </div>
      
      {/* Bottom Section - Top Stocks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StockList title="Top Gainers" showAddButton />
        <StockList title="Most Active" />
      </div>
    </div>
  );
}