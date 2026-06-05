"use client"

import { useState } from "react"
import { Minus, Plus, ArrowUpDown, Wallet, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import type { Stock } from "@/lib/stock-data"

interface OrderPanelProps {
  stock: Stock
}

export function OrderPanel({ stock }: OrderPanelProps) {
  const [orderType, setOrderType] = useState("market")
  const [quantity, setQuantity] = useState(1)
  const [limitPrice, setLimitPrice] = useState(stock.price)

  const totalCost = orderType === "market" 
    ? quantity * stock.price 
    : quantity * limitPrice

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Trade {stock.symbol}</h2>
      </div>

      <Tabs defaultValue="buy" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-border h-10">
          <TabsTrigger value="buy" className="flex-1 rounded-none data-[state=active]:bg-positive/10 data-[state=active]:text-positive">
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex-1 rounded-none data-[state=active]:bg-negative/10 data-[state=active]:text-negative">
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="flex-1 m-0 p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Order Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("market")}
                className="h-8"
              >
                Market
              </Button>
              <Button
                variant={orderType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("limit")}
                className="h-8"
              >
                Limit
              </Button>
            </div>
          </div>

          {orderType === "limit" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Limit Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="pl-7 font-mono"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center font-mono h-8"
                min="1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Quick Select</span>
            </div>
            <Slider
              value={[quantity]}
              onValueChange={([v]) => setQuantity(v)}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <Card className="bg-secondary border-0">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market Price</span>
                <span className="font-mono">${stock.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono">{quantity} shares</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                <span>Estimated Total</span>
                <span className="font-mono">${totalCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-positive hover:bg-positive/90 text-positive-foreground">
            Buy {stock.symbol}
          </Button>
        </TabsContent>

        <TabsContent value="sell" className="flex-1 m-0 p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Order Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("market")}
                className="h-8"
              >
                Market
              </Button>
              <Button
                variant={orderType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("limit")}
                className="h-8"
              >
                Limit
              </Button>
            </div>
          </div>

          {orderType === "limit" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Limit Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="pl-7 font-mono"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center font-mono h-8"
                min="1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Card className="bg-secondary border-0">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market Price</span>
                <span className="font-mono">${stock.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono">{quantity} shares</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
                <span>Estimated Total</span>
                <span className="font-mono">${totalCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full bg-negative hover:bg-negative/90 text-negative-foreground">
            Sell {stock.symbol}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Account Summary */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="h-3 w-3" />
          <span>Available Balance</span>
        </div>
        <div className="font-mono font-bold text-lg">$125,432.67</div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-positive" />
          <span className="text-positive font-medium">+$2,341.56 (1.9%)</span>
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  )
}
