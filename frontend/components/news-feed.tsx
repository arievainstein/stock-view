"use client"

import { useEffect, useState } from "react"
import { Clock, ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api-client"
import type { NewsItem, SectorPerformance } from "@/lib/api-client"

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [sectors, setSectors] = useState<SectorPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([api.getNews(undefined, 8), api.getSectorPerformance()])
      .then(([n, s]) => {
        if (active) {
          setNews(n)
          setSectors(s)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Market News */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Latest News
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-4 w-10 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              : news.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {item.symbol ?? "MKT"}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{item.source}</span>
                          <span>&bull;</span>
                          <span>{item.time_published}</span>
                          {item.sentiment_label && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] h-4",
                                item.sentiment_label.toLowerCase().includes("bull")
                                  ? "text-positive"
                                  : item.sentiment_label.toLowerCase().includes("bear")
                                  ? "text-negative"
                                  : ""
                              )}
                            >
                              {item.sentiment_label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </a>
                ))}
          </CardContent>
        </Card>

        {/* Sector Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sector Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              : sectors.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sector.name}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-mono font-medium text-xs",
                        sector.change >= 0 ? "text-positive" : "text-negative"
                      )}
                    >
                      {sector.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {sector.change >= 0 ? "+" : ""}
                      {sector.change.toFixed(2)}%
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
