"use client"

import { useEffect, useState } from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  CandlestickChart,
  Layers,
  LineChart as LineChartIcon,
  Maximize2,
  Settings2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-client"
import type { ChartDataPoint, PeriodStats, RegressionChannel, Stock } from "@/lib/api-client"

interface StockChartProps {
  stock: Stock
}

const TIMEFRAMES: { label: string; interval: string }[] = [
  { label: "1D", interval: "5min" },
  { label: "1W", interval: "30min" },
  { label: "1M", interval: "daily" },
  { label: "3M", interval: "daily" },
  { label: "1Y", interval: "daily" },
  { label: "5Y", interval: "weekly" },
  { label: "ALL", interval: "monthly" },
]

const chartTypes = [
  { icon: LineChartIcon, label: "Line" },
  { icon: CandlestickChart, label: "Candle" },
  { icon: BarChart3, label: "Bar" },
  { icon: Layers, label: "Area" },
]

// Log regression channels only make sense on daily/weekly/monthly data
const LOG_REG_INTERVALS = new Set(["daily", "weekly", "monthly"])

type LogChannel = { upper: number; middle: number; lower: number }

function buildDateMap(ch: RegressionChannel): Map<string, LogChannel> {
  const m = new Map<string, LogChannel>()
  ch.times.forEach((t, i) => {
    m.set(t, { upper: ch.upper[i], middle: ch.middle[i], lower: ch.lower[i] })
  })
  return m
}

export function StockChart({ stock }: StockChartProps) {
  const [timeframe, setTimeframe] = useState("3M")
  const [chartType, setChartType] = useState("Area")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showTight, setShowTight] = useState(true)
  const [showFibonacci, setShowFibonacci] = useState(true)
  const [showWide, setShowWide] = useState(true)
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null)
  const [pearsonR, setPearsonR] = useState<number | null>(null)
  const [logScale, setLogScale] = useState(false)

  const interval = TIMEFRAMES.find((t) => t.label === timeframe)?.interval ?? "daily"
  console.log("Selected interval:", interval)
  console.log("Selected timeframe:", timeframe)

  const showLogReg = LOG_REG_INTERVALS.has(interval)

  useEffect(() => {
    let active = true
    setLoading(true)
    setChartData([])
    setPeriodStats(null)
    setPearsonR(null)

    const load = async () => {
      try {
        // Fetch chart data + all 3 log regression channels in parallel
        const [res, tightCh, fibCh, wideCh] = await Promise.all([
          api.getChart(stock.symbol, interval, true, timeframe),
          showLogReg ? api.getLogRegressionTight(stock.symbol, timeframe).catch(() => null) : Promise.resolve(null),
          showLogReg ? api.getLogRegressionFibonacci(stock.symbol, timeframe).catch(() => null) : Promise.resolve(null),
          showLogReg ? api.getLogRegressionWide(stock.symbol, timeframe).catch(() => null) : Promise.resolve(null),
        ])
        if (!active) return

        const reg = res.regression_channel
        const tightMap = tightCh ? buildDateMap(tightCh) : null
        const fibMap   = fibCh   ? buildDateMap(fibCh)   : null
        const wideMap  = wideCh  ? buildDateMap(wideCh)  : null

        const merged = res.data.map((pt, i) => {
          const dateKey = pt.time.slice(0, 10)  // normalize to YYYY-MM-DD for lookup
          const tight = tightMap?.get(dateKey)
          const fib   = fibMap?.get(dateKey)
          const wide  = wideMap?.get(dateKey)
          return {
            ...pt,
            regUpper:  reg?.upper[i],
            regMiddle: reg?.middle[i],
            regLower:  reg?.lower[i],
            // tight Â±1
            tightUpper:  tight?.upper,
            tightMiddle: tight?.middle,
            tightLower:  tight?.lower,
            // fibonacci Â±1.618
            fibUpper:  fib?.upper,
            fibMiddle: fib?.middle,
            fibLower:  fib?.lower,
            // wide Â±2.618
            wideUpper:  wide?.upper,
            wideMiddle: wide?.middle,
            wideLower:  wide?.lower,
          }
        })

        setChartData(merged)
        setPeriodStats(res.period_stats)
        setPearsonR(tightCh?.pearson_r ?? null)
        setLoading(false)
      } catch {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [stock.symbol, interval, timeframe])

  const isPositive = stock.change >= 0
  // Chart color follows the selected timeframe's period change when available,
  // falling back to the intraday quote change.
  const periodIsPositive = periodStats != null ? periodStats.period_change_pct >= 0 : isPositive
  const chartColor = periodIsPositive ? "var(--positive)" : "var(--negative)"

  const tooltipLabels: Record<string, string> = {
    close:        "Price",
    regUpper:     "Reg Upper",
    regMiddle:    "Regression",
    regLower:     "Reg Lower",
    tightUpper:   "Tight Upper (Ã—1)",
    tightMiddle:  "Tight Mid (Ã—1)",
    tightLower:   "Tight Lower (Ã—1)",
    fibUpper:     "Fib Upper (Ã—1.618)",
    fibMiddle:    "Fib Mid (Ã—1.618)",
    fibLower:     "Fib Lower (Ã—1.618)",
    wideUpper:    "Wide Upper (Ã—2.618)",
    wideMiddle:   "Wide Mid (Ã—2.618)",
    wideLower:    "Wide Lower (Ã—2.618)",
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Stock Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary font-bold text-lg">
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{stock.symbol}</h1>
              <span className="text-sm text-muted-foreground">{stock.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-bold font-mono">
                {stock.price > 0 ? (
                  `$${stock.price.toFixed(2)}`
                ) : (
                  <Skeleton className="h-8 w-28 inline-block" />
                )}
              </span>
              {stock.price > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md font-medium text-sm",
                    isPositive
                      ? "bg-positive/10 text-positive"
                      : "bg-negative/10 text-negative"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-mono">
                    {isPositive ? "+" : ""}${stock.change.toFixed(2)} (
                    {isPositive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              )}
              {periodStats && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md font-medium text-sm border",
                    periodStats.period_change_pct >= 0
                      ? "border-positive/30 text-positive bg-positive/5"
                      : "border-negative/30 text-negative bg-negative/5"
                  )}
                  title={`Period: $${periodStats.period_open.toFixed(2)} → $${periodStats.period_close.toFixed(2)}`}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-1">{timeframe}</span>
                  {periodStats.period_change_pct >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-mono">
                    {periodStats.period_change_pct >= 0 ? "+" : ""}
                    {periodStats.period_change_pct.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden flex items-center gap-2">
          <Button variant="default" size="sm">Buy</Button>
          <Button variant="outline" size="sm">Sell</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border">
        <Tabs value={timeframe} onValueChange={setTimeframe}>
          <TabsList className="h-8">
            {TIMEFRAMES.map(({ label }) => (
              <TabsTrigger key={label} value={label} className="text-xs px-3 h-7">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Layers className="h-4 w-4" />
                {chartType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {chartTypes.map((type) => (
                <DropdownMenuItem
                  key={type.label}
                  onClick={() => setChartType(type.label)}
                  className="gap-2"
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between gap-3">
                Log Regression Channels
                {showLogReg && pearsonR != null && (
                  <span
                    className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: Math.abs(pearsonR) >= 0.9 ? (pearsonR > 0 ? "#4ade80" : "#f87171")
                           : Math.abs(pearsonR) >= 0.7 ? (pearsonR > 0 ? "#86efac" : "#fca5a5")
                           : "#facc15",
                      background: "rgba(128,128,128,0.12)",
                    }}
                    title="Pearson r (log-linear trend strength)"
                  >
                    r = {pearsonR.toFixed(2)}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showTight}
                onCheckedChange={setShowTight}
                disabled={!showLogReg}
              >
                <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ background: "#38bdf8" }} />
                Tight (&times;1)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showFibonacci}
                onCheckedChange={setShowFibonacci}
                disabled={!showLogReg}
              >
                <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ background: "#a78bfa" }} />
                Fibonacci (&times;1.618)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showWide}
                onCheckedChange={setShowWide}
                disabled={!showLogReg}
              >
                <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ background: "#fb923c" }} />
                Wide (&times;2.618)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Log / Linear scale toggle */}
          <Button
            variant={logScale ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2 font-mono text-xs"
            onClick={() => setLogScale((v) => !v)}
            title={logScale ? "Switch to linear scale" : "Switch to logarithmic scale"}
          >
            {logScale ? "Log" : "Lin"}
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4 min-h-[300px]">
        {loading ? (
          <Skeleton className="w-full h-full rounded-md" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                scale={logScale ? "log" : "auto"}
                domain={logScale
                  ? ([dataMin, dataMax]: [number, number]) => {
                      // log scale needs strictly positive bounds; add a small buffer
                      const lo = Math.max(0.01, dataMin * 0.97)
                      const hi = dataMax * 1.03
                      return [lo, hi]
                    }
                  : ([dataMin, dataMax]: [number, number]) => {
                      const pad = (dataMax - dataMin) * 0.05 || 5
                      return [Math.max(0, dataMin - pad), dataMax + pad]
                    }
                }
                allowDataOverflow
                tickFormatter={(v) => `$${v < 10 ? v.toFixed(2) : v.toFixed(0)}`}
                orientation="right"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  tooltipLabels[name] ?? name,
                ]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              {/* Price */}
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#chartGradient)"
              />

              {/* Original regression channel */}
              {/* <Line type="monotone" dataKey="regUpper"  stroke="rgba(255,200,0,0.4)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />
              <Line type="monotone" dataKey="regMiddle" stroke="rgba(255,200,0,0.7)" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="regLower"  stroke="rgba(255,200,0,0.4)" strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls /> */}

              {/* Log regression channels — always rendered; visibility via strokeOpacity
                  to avoid recharts losing series state when children change conditionally */}
              <Line type="monotone" dataKey="tightUpper"  stroke="#38bdf8" strokeOpacity={showLogReg && showTight ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />
              <Line type="monotone" dataKey="tightMiddle" stroke="#38bdf8" strokeOpacity={showLogReg && showTight ? 1 : 0} strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="tightLower"  stroke="#38bdf8" strokeOpacity={showLogReg && showTight ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />

              <Line type="monotone" dataKey="fibUpper"  stroke="#a78bfa" strokeOpacity={showLogReg && showFibonacci ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />
              <Line type="monotone" dataKey="fibMiddle" stroke="#a78bfa" strokeOpacity={showLogReg && showFibonacci ? 1 : 0} strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="fibLower"  stroke="#a78bfa" strokeOpacity={showLogReg && showFibonacci ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />

              <Line type="monotone" dataKey="wideUpper"  stroke="#fb923c" strokeOpacity={showLogReg && showWide ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />
              <Line type="monotone" dataKey="wideMiddle" stroke="#fb923c" strokeOpacity={showLogReg && showWide ? 1 : 0} strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="wideLower"  stroke="#fb923c" strokeOpacity={showLogReg && showWide ? 1 : 0} strokeWidth={1}   dot={false} strokeDasharray="5 2" connectNulls />

            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume Chart */}
      <div className="h-20 px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Bar
              dataKey="volume"
              fill="var(--muted-foreground)"
              opacity={0.3}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
