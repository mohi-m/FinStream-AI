import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinancialCardProps {
  title: string;
  value: string;
  change?: string;
  changePercent?: number;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function FinancialCard({ 
  title, 
  value, 
  change, 
  changePercent, 
  icon, 
  className,
  children 
}: FinancialCardProps) {
  const isPositive = changePercent !== undefined ? changePercent >= 0 : false;
  
  return (
    <Card className={cn("shadow-card hover:shadow-financial transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={cn(
            "text-xs font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {change}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}