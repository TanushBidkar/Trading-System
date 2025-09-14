"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, BarChart3, RotateCcw, ShoppingCart } from "lucide-react"
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, Pie } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import LivePortfolioTracker from "./live-portfolio-tracker"

interface PortfolioAnalytics {
  totalValue: number
  totalReturn: number
  sharpeRatio: number
  volatility: number
  maxDrawdown: number
  beta: number
  alpha: number
  var95: number
  diversificationRatio: number
}

interface RiskMetrics {
  portfolioRisk: number
  concentrationRisk: number
  sectorExposure: { [key: string]: number }
  correlationMatrix: { [key: string]: { [key: string]: number } }
}

interface RebalanceRecommendation {
  symbol: string
  currentAllocation: number
  targetAllocation: number
  recommendedAction: "buy" | "sell" | "hold"
  quantity: number
  reason: string
}

interface PortfolioManagementProps {
  userId: string
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

export default function PortfolioManagement({ userId }: PortfolioManagementProps) {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null)
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [rebalanceRecommendations, setRebalanceRecommendations] = useState<RebalanceRecommendation[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Order management state
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy")
  const [selectedSymbol, setSelectedSymbol] = useState("")
  const [orderQuantity, setOrderQuantity] = useState("")
  const [limitPrice, setLimitPrice] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("")

  // Risk management state
  const [riskTolerance, setRiskTolerance] = useState([50])
  const [maxPositionSize, setMaxPositionSize] = useState([10])
  const [stopLossPercent, setStopLossPercent] = useState([5])

  useEffect(() => {
    fetchPortfolioData()
  }, [userId])

  const fetchPortfolioData = async () => {
    try {
      await Promise.all([
        fetchPositions(),
        calculateAnalytics(),
        calculateRiskMetrics(),
        generateRebalanceRecommendations(),
      ])
    } catch (error) {
      console.error("Error fetching portfolio data:", error)
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("portfolio_positions")
        .select(`
          *,
          trading_agents!inner(user_id, name)
        `)
        .eq("trading_agents.user_id", userId)
        .neq("quantity", 0)

      if (error) {
        if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description:
              "Please run the database setup scripts first: 01-create-tables.sql, 02-seed-data.sql, 03-add-collaboration-tables.sql",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setPositions(data || [])
    } catch (error) {
      console.error("Error fetching positions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch portfolio positions",
        variant: "destructive",
      })
    }
  }

  const calculateAnalytics = async () => {
    // Mock analytics calculation - in real implementation, this would use historical data
    const mockAnalytics: PortfolioAnalytics = {
      totalValue: 125000,
      totalReturn: 0.15,
      sharpeRatio: 1.2,
      volatility: 0.18,
      maxDrawdown: 0.08,
      beta: 1.05,
      alpha: 0.03,
      var95: 0.025,
      diversificationRatio: 0.75,
    }
    setAnalytics(mockAnalytics)
  }

  const calculateRiskMetrics = async () => {
    // Mock risk metrics - in real implementation, this would calculate actual correlations and exposures
    const mockRiskMetrics: RiskMetrics = {
      portfolioRisk: 0.18,
      concentrationRisk: 0.35,
      sectorExposure: {
        Technology: 40,
        Healthcare: 25,
        Finance: 20,
        Consumer: 10,
        Energy: 5,
      },
      correlationMatrix: {
        AAPL: { AAPL: 1.0, GOOGL: 0.7, MSFT: 0.8 },
        GOOGL: { AAPL: 0.7, GOOGL: 1.0, MSFT: 0.6 },
        MSFT: { AAPL: 0.8, GOOGL: 0.6, MSFT: 1.0 },
      },
    }
    setRiskMetrics(mockRiskMetrics)
  }

  const generateRebalanceRecommendations = async () => {
    const mockRecommendations: RebalanceRecommendation[] = [
      {
        symbol: "RELIANCE",
        currentAllocation: 25,
        targetAllocation: 20,
        recommendedAction: "sell",
        quantity: 50,
        reason: "Overweight position, reduce concentration risk",
      },
      {
        symbol: "TCS",
        currentAllocation: 15,
        targetAllocation: 18,
        recommendedAction: "buy",
        quantity: 25,
        reason: "Underweight position, good growth potential",
      },
      {
        symbol: "INFY",
        currentAllocation: 30,
        targetAllocation: 25,
        recommendedAction: "sell",
        quantity: 75,
        reason: "High volatility, reduce exposure",
      },
    ]
    setRebalanceRecommendations(mockRecommendations)
  }

  const executeOrder = async () => {
    console.log("Place order clicked", { selectedAgent, selectedSymbol, orderQuantity, orderType, orderSide })

    if (!selectedAgent || !selectedSymbol || !orderQuantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error: orderError } = await supabase.from("orders").insert({
        agent_id: selectedAgent,
        symbol: selectedSymbol,
        order_type: orderType,
        side: orderSide,
        quantity: Number.parseInt(orderQuantity),
        price: limitPrice ? Number.parseFloat(limitPrice) : null,
        status: "filled", // Set as filled for demo purposes
        created_at: new Date().toISOString(),
      })

      if (orderError) {
        if (orderError.message.includes("schema cache") || orderError.message.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts to create the orders table",
            variant: "destructive",
          })
          return
        }
        throw orderError
      }

      const currentPrice = Math.random() * 1000 + 500 // Mock current price for demo
      const quantity = orderSide === "buy" ? Number.parseInt(orderQuantity) : -Number.parseInt(orderQuantity)

      // Check if position already exists
      const { data: existingPosition } = await supabase
        .from("portfolio_positions")
        .select("*")
        .eq("agent_id", selectedAgent)
        .eq("symbol", selectedSymbol)
        .single()

      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + quantity
        const newAvgPrice =
          newQuantity === 0
            ? 0
            : (existingPosition.avg_price * existingPosition.quantity + currentPrice * quantity) / newQuantity

        await supabase
          .from("portfolio_positions")
          .update({
            quantity: newQuantity,
            avg_price: newAvgPrice,
            current_price: currentPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPosition.id)
      } else {
        // Create new position
        await supabase.from("portfolio_positions").insert({
          agent_id: selectedAgent,
          symbol: selectedSymbol,
          quantity: quantity,
          avg_price: currentPrice,
          current_price: currentPrice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      toast({
        title: "Order Placed",
        description: `${orderSide.toUpperCase()} order for ${orderQuantity} shares of ${selectedSymbol} has been placed and filled`,
      })

      await fetchPositions()

      // Reset form
      setSelectedSymbol("")
      setOrderQuantity("")
      setLimitPrice("")
      setSelectedAgent("")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeRebalance = async (recommendation: RebalanceRecommendation) => {
    try {
      const { error } = await supabase.from("orders").insert({
        agent_id: selectedAgent,
        symbol: recommendation.symbol,
        order_type: "market",
        side: recommendation.recommendedAction === "buy" ? "buy" : "sell",
        quantity: recommendation.quantity,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (error) {
        if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts to create the orders table",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      toast({
        title: "Rebalance Order Placed",
        description: `${recommendation.recommendedAction.toUpperCase()} ${recommendation.quantity} shares of ${recommendation.symbol}`,
      })
    } catch (error) {
      toast({
        title: "Rebalance Failed",
        description: "Failed to execute rebalancing order",
        variant: "destructive",
      })
    }
  }

  const executePortfolioRebalance = async () => {
    if (!rebalanceRecommendations.length) {
      await generateRebalanceRecommendations()
      // Wait a moment for state to update
      setTimeout(async () => {
        await executeAllRebalanceOrders()
      }, 100)
      return
    }

    await executeAllRebalanceOrders()
  }

  const executeAllRebalanceOrders = async () => {
    try {
      // Execute all rebalancing recommendations
      for (const rec of rebalanceRecommendations) {
        await executeRebalance(rec)
      }

      toast({
        title: "Portfolio Rebalanced",
        description: `Executed ${rebalanceRecommendations.length} rebalancing orders`,
      })
    } catch (error) {
      toast({
        title: "Rebalancing Failed",
        description: "Some rebalancing orders may have failed",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const sectorData = riskMetrics
    ? Object.entries(riskMetrics.sectorExposure).map(([sector, value]) => ({
        name: sector,
        value,
        color: COLORS[Object.keys(riskMetrics.sectorExposure).indexOf(sector) % COLORS.length],
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Portfolio Management</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Place Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Place Trading Order</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Execute buy or sell orders for your portfolio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Order Type</Label>
                    <Select value={orderType} onValueChange={(value: "market" | "limit") => setOrderType(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Side</Label>
                    <Select value={orderSide} onValueChange={(value: "buy" | "sell") => setOrderSide(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Symbol</Label>
                  <Input
                    placeholder="e.g., AAPL"
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Number of shares"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                {orderType === "limit" && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Limit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price per share"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-300">Trading Agent</Label>
                  <Input
                    placeholder="Agent ID"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <Button onClick={executeOrder} className="w-full" disabled={isLoading}>
                  {isLoading ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={executePortfolioRebalance} className="bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="mr-2 h-4 w-4" />
            Rebalance Portfolio
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalancing</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LivePortfolioTracker userId={userId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Return</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{formatPercent(analytics.totalReturn)}</div>
                    <p className="text-xs text-slate-400">Since inception</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Sharpe Ratio</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{analytics.sharpeRatio.toFixed(2)}</div>
                    <p className="text-xs text-slate-400">Risk-adjusted return</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Volatility</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{formatPercent(analytics.volatility)}</div>
                    <p className="text-xs text-slate-400">Annualized</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                    <CardDescription className="text-slate-400">Key portfolio performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Alpha</span>
                      <span className="text-white font-mono">{formatPercent(analytics.alpha)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Beta</span>
                      <span className="text-white font-mono">{analytics.beta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Value at Risk (95%)</span>
                      <span className="text-white font-mono">{formatPercent(analytics.var95)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Diversification Ratio</span>
                      <span className="text-white font-mono">{analytics.diversificationRatio.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Sector Allocation</CardTitle>
                    <CardDescription className="text-slate-400">Portfolio exposure by sector</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                    <CardDescription className="text-slate-400">Key portfolio performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Alpha</span>
                      <span className="text-white font-mono">{formatPercent(analytics.alpha)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Beta</span>
                      <span className="text-white font-mono">{analytics.beta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Value at Risk (95%)</span>
                      <span className="text-white font-mono">{formatPercent(analytics.var95)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Diversification Ratio</span>
                      <span className="text-white font-mono">{analytics.diversificationRatio.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Sector Allocation</CardTitle>
                    <CardDescription className="text-slate-400">Portfolio exposure by sector</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Risk Settings</CardTitle>
                <CardDescription className="text-slate-400">Configure portfolio risk parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Risk Tolerance: {riskTolerance[0]}%</Label>
                  <Slider
                    value={riskTolerance}
                    onValueChange={setRiskTolerance}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Position Size: {maxPositionSize[0]}%</Label>
                  <Slider
                    value={maxPositionSize}
                    onValueChange={setMaxPositionSize}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Stop Loss: {stopLossPercent[0]}%</Label>
                  <Slider
                    value={stopLossPercent}
                    onValueChange={setStopLossPercent}
                    max={20}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <Button className="w-full">Update Risk Settings</Button>
              </CardContent>
            </Card>

            {riskMetrics && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk Metrics</CardTitle>
                  <CardDescription className="text-slate-400">Current portfolio risk assessment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Portfolio Risk</span>
                      <Badge variant={riskMetrics.portfolioRisk > 0.2 ? "destructive" : "default"}>
                        {formatPercent(riskMetrics.portfolioRisk)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Concentration Risk</span>
                      <Badge variant={riskMetrics.concentrationRisk > 0.3 ? "destructive" : "default"}>
                        {formatPercent(riskMetrics.concentrationRisk)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Risk Level</h4>
                    <Progress value={riskMetrics.portfolioRisk * 100} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Portfolio Rebalancing
              </CardTitle>
              <CardDescription className="text-slate-400">
                AI-powered recommendations to optimize your portfolio allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rebalanceRecommendations.map((rec, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{rec.symbol}</h3>
                        <Badge variant={rec.recommendedAction === "buy" ? "default" : "destructive"}>
                          {rec.recommendedAction.toUpperCase()}
                        </Badge>
                      </div>
                      <Button onClick={() => executeRebalance(rec)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Execute
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Current:</span>
                        <div className="font-mono text-white">{rec.currentAllocation}%</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Target:</span>
                        <div className="font-mono text-white">{rec.targetAllocation}%</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Action:</span>
                        <div className="font-mono text-white">
                          {rec.recommendedAction} {rec.quantity}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Difference:</span>
                        <div
                          className={`font-mono ${rec.currentAllocation > rec.targetAllocation ? "text-red-500" : "text-green-500"}`}
                        >
                          {rec.currentAllocation > rec.targetAllocation ? "-" : "+"}
                          {Math.abs(rec.currentAllocation - rec.targetAllocation)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Position Management</CardTitle>
              <CardDescription className="text-slate-400">
                Detailed view and management of all positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Symbol</TableHead>
                    <TableHead className="text-slate-300">Agent</TableHead>
                    <TableHead className="text-slate-300">Quantity</TableHead>
                    <TableHead className="text-slate-300">Avg Price</TableHead>
                    <TableHead className="text-slate-300">Current Price</TableHead>
                    <TableHead className="text-slate-300">Market Value</TableHead>
                    <TableHead className="text-slate-300">P&L</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position, index) => (
                    <TableRow key={index} className="border-slate-700">
                      <TableCell className="text-white font-medium">{position.symbol}</TableCell>
                      <TableCell className="text-slate-300">{position.trading_agents?.name || "N/A"}</TableCell>
                      <TableCell className="text-slate-300">{position.quantity}</TableCell>
                      <TableCell className="text-slate-300">{formatCurrency(position.average_price)}</TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(position.current_price || position.average_price)}
                      </TableCell>
                      <TableCell className="text-slate-300">{formatCurrency(position.market_value || 0)}</TableCell>
                      <TableCell className={position.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                        {position.unrealized_pnl >= 0 ? "+" : ""}
                        {formatCurrency(position.unrealized_pnl || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 bg-transparent"
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive">
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
