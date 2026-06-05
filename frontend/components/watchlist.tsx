"use client"

import { useState, useEffect } from "react"
import { Star, TrendingUp, TrendingDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api-client"
import type { Stock } from "@/lib/api-client"
import { WATCHLIST_SYMBOLS } from "@/lib/stock-data"

interface WatchlistProps {
  onSelectStock: (stock: Stock) => void
  selectedSymbol?: string
}

function StockRow({
  stock,
  selected,
  onClick,
}: {
  stock: Stock
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-2 rounded-md transition-colors text-left",
        "hover:bg-accent",
        selected && "bg-accent"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Star className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-sm">{stock.symbol}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
            {stock.name}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-mono text-sm font-medium">${stock.price.toFixed(2)}</div>
        <div
          className={cn(
            "flex items-center justify-end gap-0.5 text-xs font-medium font-mono",
            stock.change >= 0 ? "text-positive" : "text-negative"
          )}
        >
          {stock.change >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {stock.change >= 0 ? "+" : ""}
          {stock.changePercent.toFixed(2)}%
        </div>
      </div>
    </button>
  )
}

function LoadingRows() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-1 items-end flex flex-col">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Watchlist({ onSelectStock, selectedSymbol }: WatchlistProps) {
  const [activeTab, setActiveTab] = useState("watchlist")
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setStocks([])

    const load = async () => {
      try {
        let data: Stock[]
        if (activeTab === "gainers") {
          data = await api.getTopGainers()
        } else if (activeTab === "losers") {
          data = await api.getTopLosers()
        } else {
          data = await Promise.all(WATCHLIST_SYMBOLS.map((s) => api.getQuote(s)))
        }
        if (active) {
          setStocks(data)
          setLoading(false)
        }
      } catch {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [activeTab])

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Watchlist</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-2 pt-2">
        <TabsList className="w-full h-8 p-0.5">
          <TabsTrigger value="watchlist" className="flex-1 text-xs h-7">
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="gainers" className="flex-1 text-xs h-7">
            Gainers
          </TabsTrigger>
          <TabsTrigger value="losers" className="flex-1 text-xs h-7">
            Losers
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ScrollArea className="flex-1">
        {loading ? (
          <LoadingRows />
        ) : (
          <div className="p-2 space-y-1">
            {stocks.map((stock) => (
              <StockRow
                key={stock.symbol}
                stock={stock}
                selected={selectedSymbol === stock.symbol}
                onClick={() => onSelectStock(stock)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
