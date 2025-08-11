import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockPrice } from "@/components/ui/stock-price";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import { mockStocks } from "@/data/mockData";
import { Stock } from "@/types/stock";

interface StockListProps {
  title: string;
  stocks?: Stock[];
  showAddButton?: boolean;
}

export function StockList({ title, stocks = mockStocks, showAddButton = false }: StockListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {showAddButton && (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {stocks.slice(0, 5).map((stock) => (
            <div key={stock.symbol} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <span className="text-sm font-semibold text-primary">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{stock.symbol}</h4>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <StockPrice
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    size="sm"
                  />
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}