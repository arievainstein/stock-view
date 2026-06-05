"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api-client"
import type { MarketIndex } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

export function MarketTicker() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await api.getMarketIndices()
        if (active) {
          setIndices(data)
          setLoading(false)
        }
      } catch {
        if (active) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="border-b border-border bg-card overflow-hidden">
      <div className="flex items-center gap-6 px-4 py-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          US Markets
        </span>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-36 shrink-0" />
            ))
          : indices.map((index) => (
              <div
                key={index.name}
                className="flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <span className="font-medium">{index.name}</span>
                <span className="font-mono">
                  {index.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-medium font-mono text-xs",
                    index.change >= 0 ? "text-positive" : "text-negative"
                  )}
                >
                  {index.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {index.change >= 0 ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          Live
        </span>
      </div>
    </div>
  )
}
