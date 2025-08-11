import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockPriceProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StockPrice({ 
  price, 
  change, 
  changePercent, 
  size = 'md',
  showIcon = true,
  className 
}: StockPriceProps) {
  const isPositive = change >= 0;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("font-medium", sizeClasses[size])}>
        ${price.toFixed(2)}
      </span>
      
      <div className={cn(
        "flex items-center gap-1",
        isPositive ? "text-success" : "text-destructive"
      )}>
        {showIcon && (
          isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )
        )}
        <span className="text-sm">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}