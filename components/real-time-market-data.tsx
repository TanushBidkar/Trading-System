"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MarketDataPoint {
  symbol: string
  open_price: number
  high_price: number
  low_price: number
  close_price: number
  volume: number
  change: number
  change_percent: string
}

interface RealTimeMarketDataProps {
  onDataUpdate?: (data: MarketDataPoint[]) => void
}

export default function RealTimeMarketData({ onDataUpdate }: RealTimeMarketDataProps) {
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/market/live-data")
      const result = await response.json()

      if (result.success && result.data) {
        setMarketData(result.data)
        setLastUpdate(new Date())
        setIsConnected(true)
        onDataUpdate?.(result.data)
      } else {
        throw new Error("Failed to fetch market data")
      }
    } catch (error) {
      console.error("Market data fetch error:", error)
      setIsConnected(false)
      toast({
        title: "Connection Error",
        description: "Failed to fetch real-time market data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [onDataUpdate])

  const updatePortfolioPrices = useCallback(async () => {
    try {
      const response = await fetch("/api/portfolio/update-prices", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Portfolio Updated",
          description: `Updated prices for ${result.updatedSymbols} symbols`,
        })
      }
    } catch (error) {
      console.error("Portfolio update error:", error)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchMarketData()

    // Set up real-time updates every 15 seconds
    const interval = setInterval(() => {
      fetchMarketData()
      updatePortfolioPrices()
    }, 15000)

    return () => clearInterval(interval)
  }, [fetchMarketData, updatePortfolioPrices])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toString()
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              Indian Stock Market - Live Data
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : "Loading market data..."}
            </CardDescription>
          </div>
          <Button
            onClick={fetchMarketData}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  NSE Live Data Connected
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Connection Lost
                </>
              )}
            </Badge>
            <span className="text-xs text-slate-400">Updates every 15 seconds</span>
          </div>

          {/* Market Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Symbol</TableHead>
                  <TableHead className="text-slate-300">Price (₹)</TableHead>
                  <TableHead className="text-slate-300">Change (₹)</TableHead>
                  <TableHead className="text-slate-300">Change %</TableHead>
                  <TableHead className="text-slate-300">Volume</TableHead>
                  <TableHead className="text-slate-300">High (₹)</TableHead>
                  <TableHead className="text-slate-300">Low (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData.map((data, index) => {
                  const isPositive = data.change >= 0
                  return (
                    <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{data.symbol}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatPrice(data.close_price)}</TableCell>
                      <TableCell
                        className={`flex items-center gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
                      >
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}
                        {formatPrice(data.change)}
                      </TableCell>
                      <TableCell className={`font-mono ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        {data.change_percent}
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatVolume(data.volume)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatPrice(data.high_price)}</TableCell>
                      <TableCell className="text-slate-300 font-mono">{formatPrice(data.low_price)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {marketData.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-slate-400">No market data available</p>
              <Button onClick={fetchMarketData} className="mt-2 bg-transparent" variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
