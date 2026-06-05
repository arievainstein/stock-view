"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Settings, Menu, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-client"
import type { SearchResult, Stock } from "@/lib/api-client"

interface HeaderProps {
  onSelectStock?: (stock: Stock) => void
}

export function Header({ onSelectStock }: HeaderProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchStocks(query.trim())
        setResults(data.slice(0, 8))
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = async (result: SearchResult) => {
    setQuery(result.symbol)
    setOpen(false)
    if (!onSelectStock) return
    try {
      const stock = await api.getQuote(result.symbol)
      onSelectStock(stock)
    } catch {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 6-6" />
            </svg>
          </div>
          <span className="hidden font-semibold text-lg sm:inline-block">StockView</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                Markets
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Stocks</DropdownMenuItem>
              <DropdownMenuItem>ETFs</DropdownMenuItem>
              <DropdownMenuItem>Crypto</DropdownMenuItem>
              <DropdownMenuItem>Forex</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Futures</DropdownMenuItem>
              <DropdownMenuItem>Bonds</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm">Screener</Button>
          <Button variant="ghost" size="sm">Watchlist</Button>
          <Button variant="ghost" size="sm">News</Button>
        </nav>

        {/* Search */}
        <div className="flex-1 flex justify-center max-w-md mx-4" ref={containerRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Search stocks, ETFs, crypto..."
              className="pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
            />
            {open && results.length > 0 && (
              <div className="absolute top-full mt-1 w-full z-50 rounded-md border border-border bg-card shadow-lg overflow-hidden">
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(r)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <div>
                      <span className="font-semibold">{r.symbol}</span>
                      <span className="ml-2 text-muted-foreground text-xs truncate max-w-[200px]">
                        {r.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {r.type} &middot; {r.region}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          {/* <Button size="sm" className="hidden sm:flex gap-1 ml-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button> */}
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
