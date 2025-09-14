"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Bot, IndianRupee, Activity, Settings, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import AgentManagement from "./agent-management"
import AIStrategyGenerator from "./ai-strategy-generator"
import AgentCollaboration from "./agent-collaboration"
import PortfolioManagement from "./portfolio-management"
import { signOut } from "@/lib/actions"
import RealTimeMarketData from "./real-time-market-data"

interface User {
  id: string
  email: string
}

interface TradingAgent {
  id: string
  name: string
  strategy_type: string
  status: string
  risk_tolerance: number
  current_balance: number
  total_trades: number
  successful_trades: number
  configuration: any
  last_activity?: string
  current_action?: string
}

interface MarketData {
  symbol: string
  close_price: number
  open_price: number
  high_price: number
  low_price: number
  volume: number
  timestamp: string
}

interface PortfolioPosition {
  symbol: string
  quantity: number
  average_price: number
  current_price: number
  market_value: number
  unrealized_pnl: number
}

export default function TradingDashboard({ user }: { user: User }) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [positions, setPositions] = useState<PortfolioPosition[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      await Promise.allSettled([
        fetchAgents().catch((err) => {
          console.warn("Failed to fetch agents:", err)
          setAgents([])
        }),
        fetchMarketData().catch((err) => {
          console.warn("Failed to fetch market data:", err)
          setMarketData([])
        }),
        fetchPositions().catch((err) => {
          console.warn("Failed to fetch positions:", err)
          setPositions([])
        }),
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Database Setup Required",
        description: "Please run the database setup scripts first. Check the README for instructions.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    const { data, error } = await supabase.from("trading_agents").select("*").eq("user_id", user.id)

    if (error) throw error
    setAgents(data || [])
  }

  const fetchMarketData = async () => {
    const { data, error } = await supabase
      .from("market_data")
      .select("*")
      .eq("timeframe", "1d")
      .order("timestamp", { ascending: false })
      .limit(8)

    if (error) throw error
    setMarketData(data || [])
  }

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("positions")
        .select(`
          *,
          portfolios!inner(
            trading_agents!inner(user_id)
          )
        `)
        .eq("portfolios.trading_agents.user_id", user.id)

      if (error) {
        console.warn("Positions table not found or empty:", error.message)
        setPositions([])
        return
      }

      // Transform data to match expected interface
      const transformedPositions = (data || []).map((position) => ({
        symbol: position.symbol,
        quantity: position.quantity,
        average_price: position.average_price,
        current_price: position.current_price || position.average_price,
        market_value: position.quantity * (position.current_price || position.average_price),
        unrealized_pnl:
          position.quantity * ((position.current_price || position.average_price) - position.average_price),
      }))

      setPositions(transformedPositions)
    } catch (error) {
      console.warn("Error fetching positions:", error)
      setPositions([])
    }
  }

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    const { error } = await supabase.from("trading_agents").update({ status: newStatus }).eq("id", agentId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      })
      return
    }

    setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent)))

    toast({
      title: "Success",
      description: `Agent ${newStatus === "active" ? "activated" : "deactivated"}`,
    })
  }

  const totalPortfolioValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0)
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0)
  const activeAgents = agents.filter((agent) => agent.status === "active").length
  const totalTrades = agents.reduce((sum, agent) => sum + agent.total_trades, 0)

  const performanceData = [
    { name: "Mon", value: 1025000 },
    { name: "Tue", value: 1084000 },
    { name: "Wed", value: 1052000 },
    { name: "Thu", value: 1158000 },
    { name: "Fri", value: 1142000 },
    { name: "Sat", value: 1191000 },
    { name: "Sun", value: 1248000 },
  ]

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatCompactINR = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else {
      return formatINR(amount)
    }
  }

  const mockAgentActivity = [
    {
      id: "mock-1",
      name: "Momentum Trader",
      strategy_type: "Momentum Trading",
      status: "active",
      current_balance: 500000,
      total_trades: 24,
      successful_trades: 18,
      last_activity: "2 minutes ago",
      current_action: "Analyzing RELIANCE breakout",
    },
    {
      id: "mock-2",
      name: "Value Hunter",
      strategy_type: "Value Investing",
      status: "active",
      current_balance: 750000,
      total_trades: 12,
      successful_trades: 10,
      last_activity: "5 minutes ago",
      current_action: "Monitoring TCS earnings",
    },
    {
      id: "mock-3",
      name: "Swing Master",
      strategy_type: "Swing Trading",
      status: "inactive",
      current_balance: 300000,
      total_trades: 8,
      successful_trades: 6,
      last_activity: "1 hour ago",
      current_action: "Waiting for setup",
    },
    {
      id: "mock-4",
      name: "Scalp Bot",
      strategy_type: "Scalping",
      status: "active",
      current_balance: 200000,
      total_trades: 156,
      successful_trades: 98,
      last_activity: "30 seconds ago",
      current_action: "Executing INFY scalp",
    },
  ]

  const displayAgents = agents.length > 0 ? agents : mockAgentActivity

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading trading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Multi-Agent Trading System</h1>
            <p className="text-slate-300">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Portfolio Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatINR(totalPortfolioValue)}</div>
              <p className="text-xs text-slate-400">
                <span className={totalUnrealizedPnL >= 0 ? "text-green-500" : "text-red-500"}>
                  {totalUnrealizedPnL >= 0 ? "+" : ""}
                  {formatINR(totalUnrealizedPnL)}
                </span>{" "}
                unrealized P&L
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeAgents}</div>
              <p className="text-xs text-slate-400">{agents.length} total agents</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Trades</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
              <p className="text-xs text-slate-400">Across all agents</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Success Rate</CardTitle>
              <CardDescription className="text-slate-400">Win rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalTrades > 0
                  ? Math.round((agents.reduce((sum, agent) => sum + agent.successful_trades, 0) / totalTrades) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-400">Win rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-slate-700">
              Agents
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-700">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-slate-700">
              Market Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio Performance</CardTitle>
                  <CardDescription className="text-slate-400">Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactINR(value)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatINR(value), "Portfolio Value"]}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Agent Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Agent Status</CardTitle>
                  <CardDescription className="text-slate-400">Current agent activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {displayAgents.slice(0, 4).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-white">{agent.name}</p>
                            <Badge
                              variant={agent.status === "active" ? "default" : "secondary"}
                              className={`text-xs ${agent.status === "active" ? "bg-green-600" : "bg-slate-600"}`}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{agent.strategy_type}</p>
                          <p className="text-xs text-blue-400 mt-1">
                            {agent.current_action || `Balance: ${formatCompactINR(agent.current_balance)}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {agent.last_activity || `${agent.successful_trades}/${agent.total_trades} successful`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {agent.total_trades > 0
                            ? Math.round((agent.successful_trades / agent.total_trades) * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-xs text-slate-400">Success</div>
                      </div>
                    </div>
                  ))}
                  {displayAgents.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No agents created yet</p>
                      <p className="text-xs">Create your first trading agent to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Tabs defaultValue="management" className="space-y-4">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="management" className="data-[state=active]:bg-slate-700">
                  Agent Management
                </TabsTrigger>
                <TabsTrigger value="ai-generator" className="data-[state=active]:bg-slate-700">
                  AI Strategy Generator
                </TabsTrigger>
                <TabsTrigger value="collaboration" className="data-[state=active]:bg-slate-700">
                  Collaboration
                </TabsTrigger>
              </TabsList>
              <TabsContent value="management">
                <AgentManagement user={user} />
              </TabsContent>
              <TabsContent value="ai-generator">
                <AIStrategyGenerator />
              </TabsContent>
              <TabsContent value="collaboration">
                <AgentCollaboration userId={user.id} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioManagement userId={user.id} />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <RealTimeMarketData
              onDataUpdate={(data) => {
                // Update local market data state when real-time data arrives
                const formattedData = data.map((item) => ({
                  symbol: item.symbol,
                  close_price: item.close_price,
                  open_price: item.open_price,
                  high_price: item.high_price,
                  low_price: item.low_price,
                  volume: item.volume,
                  timestamp: new Date().toISOString(),
                }))
                setMarketData(formattedData)
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
