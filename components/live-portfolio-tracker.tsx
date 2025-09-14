"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface PortfolioMetrics {
  totalValue: number
  totalPnL: number
  totalPnLPercent: number
  dayChange: number
  dayChangePercent: number
  positions: Array<{
    symbol: string
    quantity: number
    averagePrice: number
    currentPrice: number
    marketValue: number
    unrealizedPnL: number
    pnlPercent: number
    allocation: number
  }>
}

interface LivePortfolioTrackerProps {
  userId: string
}

export default function LivePortfolioTracker({ userId }: LivePortfolioTrackerProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPortfolioMetrics = async () => {
    try {
      // Get portfolio positions for user's agents
      const { data: positions } = await supabase
        .from("portfolio_positions")
        .select(`
          *,
          trading_agents!inner(user_id)
        `)
        .eq("trading_agents.user_id", userId)
        .neq("quantity", 0)

      if (!positions || positions.length === 0) {
        setMetrics({
          totalValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          positions: [],
        })
        setIsLoading(false)
        return
      }

      // Calculate metrics
      const totalValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0)
      const totalCost = positions.reduce((sum, pos) => sum + pos.quantity * pos.average_price, 0)
      const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0)
      const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

      // Calculate day change (simplified - would need historical data for accurate calculation)
      const dayChange = totalPnL * 0.1 // Mock day change as 10% of total PnL
      const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0

      const processedPositions = positions.map((pos) => ({
        symbol: pos.symbol,
        quantity: pos.quantity,
        averagePrice: pos.average_price,
        currentPrice: pos.current_price || pos.average_price,
        marketValue: pos.market_value || pos.quantity * pos.average_price,
        unrealizedPnL: pos.unrealized_pnl || 0,
        pnlPercent: pos.average_price > 0 ? ((pos.current_price - pos.average_price) / pos.average_price) * 100 : 0,
        allocation: totalValue > 0 ? ((pos.market_value || 0) / totalValue) * 100 : 0,
      }))

      setMetrics({
        totalValue,
        totalPnL,
        totalPnLPercent,
        dayChange,
        dayChangePercent,
        positions: processedPositions,
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Portfolio metrics fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolioMetrics()

    // Update every 30 seconds
    const interval = setInterval(fetchPortfolioMetrics, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-slate-400">No portfolio data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-slate-400">{lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : ""}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total P&L</CardTitle>
            {metrics.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {metrics.totalPnL >= 0 ? "+" : ""}
              {formatCurrency(metrics.totalPnL)}
            </div>
            <p className={`text-xs ${metrics.totalPnLPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
              {metrics.totalPnLPercent >= 0 ? "+" : ""}
              {metrics.totalPnLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Day Change</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.dayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {metrics.dayChange >= 0 ? "+" : ""}
              {formatCurrency(metrics.dayChange)}
            </div>
            <p className={`text-xs ${metrics.dayChangePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
              {metrics.dayChangePercent >= 0 ? "+" : ""}
              {metrics.dayChangePercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Positions</CardTitle>
            <Badge variant="secondary">{metrics.positions.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.positions.length}</div>
            <p className="text-xs text-slate-400">Active positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Position Details */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Position Details</CardTitle>
          <CardDescription className="text-slate-400">Real-time position tracking with live P&L</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.positions.map((position, index) => (
              <div key={index} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{position.symbol}</h3>
                    <Badge variant={position.unrealizedPnL >= 0 ? "default" : "destructive"}>
                      {position.pnlPercent >= 0 ? "+" : ""}
                      {position.pnlPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{formatCurrency(position.marketValue)}</div>
                    <div className={`text-sm ${position.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {position.unrealizedPnL >= 0 ? "+" : ""}
                      {formatCurrency(position.unrealizedPnL)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Quantity:</span>
                    <div className="font-mono text-white">{position.quantity}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Avg Price:</span>
                    <div className="font-mono text-white">{formatCurrency(position.averagePrice)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Price:</span>
                    <div className="font-mono text-white">{formatCurrency(position.currentPrice)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Allocation:</span>
                    <div className="font-mono text-white">{position.allocation.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Portfolio Allocation</span>
                    <span>{position.allocation.toFixed(1)}%</span>
                  </div>
                  <Progress value={position.allocation} className="h-2" />
                </div>
              </div>
            ))}

            {metrics.positions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">No active positions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
