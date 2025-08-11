import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StockPrice } from "@/components/ui/stock-price";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star } from "lucide-react";
import { mockStocks } from "@/data/mockData";

export function Markets() {
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    return `${(volume / 1000).toFixed(0)}K`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(2)}T`;
    }
    if (marketCap >= 1000000000) {
      return `${(marketCap / 1000000000).toFixed(1)}B`;
    }
    return `${(marketCap / 1000000).toFixed(0)}M`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Markets</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search stocks..." className="pl-10 w-64" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stocks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Stock</th>
                  <th className="p-4 font-medium text-muted-foreground">Price</th>
                  <th className="p-4 font-medium text-muted-foreground">Change</th>
                  <th className="p-4 font-medium text-muted-foreground">Volume</th>
                  <th className="p-4 font-medium text-muted-foreground">Market Cap</th>
                  <th className="p-4 font-medium text-muted-foreground">P/E</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockStocks.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <span className="text-sm font-semibold text-primary">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">${stock.price.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <StockPrice
                        price={0}
                        change={stock.change}
                        changePercent={stock.changePercent}
                        size="sm"
                        showIcon={false}
                      />
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{formatVolume(stock.volume)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{formatMarketCap(stock.marketCap)}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{stock.pe || 'N/A'}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Buy
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}