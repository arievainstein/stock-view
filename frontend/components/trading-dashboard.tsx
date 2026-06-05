"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MarketTicker } from "@/components/market-ticker"
import { Watchlist } from "@/components/watchlist"
import { StockChart } from "@/components/stock-chart"
import { StockDetails } from "@/components/stock-details"
import { NewsFeed } from "@/components/news-feed"
import { OrderPanel } from "@/components/order-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Stock } from "@/lib/stock-data"
import { FALLBACK_STOCK } from "@/lib/stock-data"
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable"

export function TradingDashboard() {
  const [selectedStock, setSelectedStock] = useState<Stock>(FALLBACK_STOCK)
  const [rightPanel, setRightPanel] = useState<"details" | "order" | "news">("details")

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onSelectStock={setSelectedStock} />
      <MarketTicker />
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Watchlist */}
          <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
            <Watchlist 
              onSelectStock={setSelectedStock} 
              selectedSymbol={selectedStock.symbol}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Chart */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <StockChart stock={selectedStock} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Sidebar */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="flex flex-col h-full border-l border-border bg-card">
              <Tabs 
                value={rightPanel} 
                onValueChange={(v) => setRightPanel(v as typeof rightPanel)}
                className="flex flex-col h-full"
              >
                <TabsList className="w-full rounded-none border-b border-border h-10 px-1 justify-start gap-1">
                  <TabsTrigger value="details" className="text-xs h-8 px-3">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="order" className="text-xs h-8 px-3">
                    Trade
                  </TabsTrigger>
                  <TabsTrigger value="news" className="text-xs h-8 px-3">
                    News
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 m-0 overflow-hidden">
                  <StockDetails stock={selectedStock} />
                </TabsContent>
                
                <TabsContent value="order" className="flex-1 m-0 overflow-hidden">
                  <OrderPanel stock={selectedStock} />
                </TabsContent>
                
                <TabsContent value="news" className="flex-1 m-0 overflow-hidden">
                  <NewsFeed />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        <Tabs defaultValue="chart" className="flex flex-col flex-1">
          <div className="border-b border-border">
            <TabsList className="w-full rounded-none h-10 px-2 justify-start overflow-x-auto">
              <TabsTrigger value="watchlist" className="text-xs">
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="chart" className="text-xs">
                Chart
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs">
                Details
              </TabsTrigger>
              <TabsTrigger value="trade" className="text-xs">
                Trade
              </TabsTrigger>
              <TabsTrigger value="news" className="text-xs">
                News
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="watchlist" className="flex-1 m-0 overflow-hidden">
            <Watchlist 
              onSelectStock={setSelectedStock} 
              selectedSymbol={selectedStock.symbol}
            />
          </TabsContent>
          
          <TabsContent value="chart" className="flex-1 m-0 overflow-hidden">
            <StockChart stock={selectedStock} />
          </TabsContent>
          
          <TabsContent value="details" className="flex-1 m-0 overflow-hidden">
            <StockDetails stock={selectedStock} />
          </TabsContent>
          
          <TabsContent value="trade" className="flex-1 m-0 overflow-hidden">
            <OrderPanel stock={selectedStock} />
          </TabsContent>
          
          <TabsContent value="news" className="flex-1 m-0 overflow-hidden">
            <NewsFeed />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
