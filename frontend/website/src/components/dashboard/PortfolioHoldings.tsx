import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockPrice } from "@/components/ui/stock-price";
import { MoreHorizontal, TrendingUp } from "lucide-react";
import { mockPortfolioStocks } from "@/data/mockData";

export function PortfolioHoldings() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Portfolio Holdings</CardTitle>
        <Button size="sm" variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {mockPortfolioStocks.map((holding) => (
            <div key={holding.symbol} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <span className="text-sm font-semibold text-primary">
                      {holding.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{holding.symbol}</h4>
                    <p className="text-sm text-muted-foreground">
                      {holding.shares} shares @ {formatCurrency(holding.avgCost)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(holding.totalValue)}</div>
                  <StockPrice
                    price={0} // We don't need the price display here
                    change={holding.gainLoss}
                    changePercent={holding.gainLossPercent}
                    size="sm"
                    showIcon={false}
                    className="justify-end"
                  />
                </div>
                
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}