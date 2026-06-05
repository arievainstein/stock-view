"use client"

import { useEffect, useState } from "react"
import { Clock, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api-client"
import type { Stock, StockOverview } from "@/lib/api-client"

interface StockDetailsProps {
  stock: Stock
}

function formatMarketCap(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

export function StockDetails({ stock }: StockDetailsProps) {
  const [overview, setOverview] = useState<StockOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setOverview(null)
    api
      .getOverview(stock.symbol)
      .then((d) => {
        if (active) {
          setOverview(d)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [stock.symbol])

  const todayStats = [
    { label: "Open", value: stock.open > 0 ? `$${stock.open.toFixed(2)}` : "—" },
    { label: "High", value: stock.high > 0 ? `$${stock.high.toFixed(2)}` : "—" },
    { label: "Low", value: stock.low > 0 ? `$${stock.low.toFixed(2)}` : "—" },
    {
      label: "Prev Close",
      value: stock.previousClose > 0 ? `$${stock.previousClose.toFixed(2)}` : "—",
    },
    { label: "Volume", value: stock.volume },
    {
      label: "Market Cap",
      value: overview ? formatMarketCap(overview.market_cap) : stock.marketCap,
    },
  ]

  const keyMetrics = overview
    ? [
        { label: "P/E Ratio", value: overview.pe_ratio },
        {
          label: "EPS",
          value: overview.eps !== "N/A" ? `$${overview.eps}` : "N/A",
        },
        {
          label: "Dividend Yield",
          value:
            overview.dividend_yield !== "N/A"
              ? `${(parseFloat(overview.dividend_yield) * 100).toFixed(2)}%`
              : "N/A",
        },
        {
          label: "52W High",
          value:
            overview.week_52_high !== "N/A"
              ? `$${parseFloat(overview.week_52_high).toFixed(2)}`
              : "N/A",
        },
        {
          label: "52W Low",
          value:
            overview.week_52_low !== "N/A"
              ? `$${parseFloat(overview.week_52_low).toFixed(2)}`
              : "N/A",
        },
        { label: "Avg Volume", value: overview.avg_volume },
      ]
    : null

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Today Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Today&apos;s Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-mono font-medium">{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              : keyMetrics?.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-mono font-medium">{m.value}</span>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">About {stock.symbol}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {overview?.description || "No description available."}
                </p>
                {overview && (
                  <>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Sector</span>
                        <p className="font-medium">{overview.sector || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry</span>
                        <p className="font-medium">{overview.industry || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Employees</span>
                        <p className="font-medium">
                          {overview.employees !== "N/A"
                            ? parseInt(overview.employees).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market Cap</span>
                        <p className="font-medium">
                          {formatMarketCap(overview.market_cap)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
