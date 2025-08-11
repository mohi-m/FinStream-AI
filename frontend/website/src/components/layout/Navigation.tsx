import { useState } from "react";
import { Home, TrendingUp, Briefcase, Star, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: TrendingUp, label: "Markets", id: "markets" },
  { icon: Briefcase, label: "Portfolio", id: "portfolio" },
  { icon: Star, label: "Watchlist", id: "watchlist" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="border-r bg-card w-64 p-4">
      <div className="space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              activeTab === item.id && "bg-gradient-primary text-primary-foreground"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </div>
    </nav>
  );
}