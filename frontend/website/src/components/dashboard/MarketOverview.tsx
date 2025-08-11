import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const marketData = [
  { name: "S&P 500", value: "4,567.89", change: "+23.45", changePercent: 0.52, isPositive: true },
  { name: "NASDAQ", value: "14,123.67", change: "-45.23", changePercent: -0.32, isPositive: false },
  { name: "DOW", value: "34,890.12", change: "+156.78", changePercent: 0.45, isPositive: true },
  { name: "Russell 2000", value: "1,987.34", change: "-12.45", changePercent: -0.62, isPositive: false },
];

export function MarketOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {marketData.map((market) => (
            <div key={market.name} className="space-y-2">
              <div className="text-sm text-muted-foreground">{market.name}</div>
              <div className="text-lg font-semibold">{market.value}</div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                market.isPositive ? "text-success" : "text-destructive"
              )}>
                {market.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {market.change} ({market.isPositive ? '+' : ''}{market.changePercent.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}