"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Bot,
  Plus,
  Settings,
  Trash2,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
  max_position_size: number
  current_balance: number
  total_trades: number
  successful_trades: number
  config: any
  created_at: string
  updated_at: string
}

interface TradingStrategy {
  id: string
  agent_id: string
  name: string
  description: string
  strategy_code: string
  parameters: any
  performance_score: number
  total_return: number
  sharpe_ratio: number
  max_drawdown: number
  is_active: boolean
}

const STRATEGY_TYPES = [
  { value: "momentum", label: "Momentum Trading", description: "Follows price trends and momentum indicators" },
  { value: "mean_reversion", label: "Mean Reversion", description: "Trades on price reversals to the mean" },
  { value: "arbitrage", label: "Arbitrage", description: "Exploits price differences across markets" },
  { value: "sentiment", label: "Sentiment Analysis", description: "Uses news and social sentiment data" },
  { value: "scalping", label: "Scalping", description: "High-frequency short-term trades" },
  { value: "swing", label: "Swing Trading", description: "Medium-term position trading" },
]

export default function AgentManagement({ user }: { user: User }) {
  const [agents, setAgents] = useState<TradingAgent[]>([])
  const [strategies, setStrategies] = useState<TradingStrategy[]>([])
  const [selectedAgent, setSelectedAgent] = useState<TradingAgent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Form state for creating/editing agents
  const [formData, setFormData] = useState({
    name: "",
    strategy_type: "",
    risk_tolerance: [0.5],
    position_size: [10000],
    initial_balance: [50000],
    description: "",
    auto_trade: false,
    stop_loss_percent: [2],
    take_profit_percent: [5],
    max_daily_trades: [10],
  })

  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchAgents()
    fetchStrategies()
  }, [])

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("trading_agents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          console.warn("Database tables not found. Please run the setup scripts first.")
          setAgents([])
          return
        }
        throw error
      }
      setAgents(data || [])
    } catch (error) {
      console.error("Error fetching agents:", error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from("trading_strategies")
        .select(`
          *,
          trading_agents!inner(user_id)
        `)
        .eq("trading_agents.user_id", user.id)

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          console.warn("Database tables not found. Please run the setup scripts first.")
          setStrategies([])
          return
        }
        throw error
      }
      setStrategies(data || [])
    } catch (error) {
      console.error("Error fetching strategies:", error)
    }
  }

  const createAgent = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Agent name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.strategy_type) {
      toast({
        title: "Validation Error",
        description: "Strategy type is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const agentData = {
        name: formData.name,
        strategy_type: formData.strategy_type,
        status: "inactive",
        user_id: user.id,
        config: {
          risk_tolerance: formData.risk_tolerance[0],
          position_size: formData.position_size[0],
          max_daily_trades: formData.max_daily_trades[0],
        },
      }

      const { data, error } = await supabase.from("trading_agents").insert([agentData]).select().single()

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts first. Check the README for instructions.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setAgents([data, ...agents])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Trading agent created successfully",
      })
    } catch (error) {
      console.error("Error creating agent:", error)
      toast({
        title: "Error",
        description: "Failed to create trading agent",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updateAgent = async () => {
    if (!selectedAgent) return

    try {
      const agentData = {
        name: formData.name,
        strategy_type: formData.strategy_type,
        config: {
          risk_tolerance: formData.risk_tolerance[0],
          position_size: formData.position_size[0],
          max_daily_trades: formData.max_daily_trades[0],
        },
      }

      const { data, error } = await supabase
        .from("trading_agents")
        .update(agentData)
        .eq("id", selectedAgent.id)
        .select()
        .single()

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts first. Check the README for instructions.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setAgents(agents.map((agent) => (agent.id === selectedAgent.id ? data : agent)))
      setIsEditDialogOpen(false)
      setSelectedAgent(null)
      resetForm()

      toast({
        title: "Success",
        description: "Trading agent updated successfully",
      })
    } catch (error) {
      console.error("Error updating agent:", error)
      toast({
        title: "Error",
        description: "Failed to update trading agent",
        variant: "destructive",
      })
    }
  }

  const deleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from("trading_agents").delete().eq("id", agentId)

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts first. Check the README for instructions.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setAgents(agents.filter((agent) => agent.id !== agentId))

      toast({
        title: "Success",
        description: "Trading agent deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast({
        title: "Error",
        description: "Failed to delete trading agent",
        variant: "destructive",
      })
    }
  }

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    try {
      const { error } = await supabase.from("trading_agents").update({ status: newStatus }).eq("id", agentId)

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          toast({
            title: "Database Setup Required",
            description: "Please run the database setup scripts first. Check the README for instructions.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent)))

      toast({
        title: "Success",
        description: `Agent ${newStatus === "active" ? "activated" : "deactivated"}`,
      })
    } catch (error) {
      console.error("Error updating agent status:", error)
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      strategy_type: "",
      risk_tolerance: [0.5],
      position_size: [10000],
      initial_balance: [50000],
      description: "",
      auto_trade: false,
      stop_loss_percent: [2],
      take_profit_percent: [5],
      max_daily_trades: [10],
    })
  }

  const openEditDialog = (agent: TradingAgent) => {
    setSelectedAgent(agent)
    setFormData({
      name: agent.name,
      strategy_type: agent.strategy_type,
      risk_tolerance: [agent.config?.risk_tolerance || 0.5],
      position_size: [agent.config?.position_size || 10000],
      initial_balance: [agent.current_balance],
      description: agent.config?.description || "",
      auto_trade: agent.config?.auto_trade || false,
      stop_loss_percent: [agent.config?.stop_loss_percent || 2],
      take_profit_percent: [agent.config?.take_profit_percent || 5],
      max_daily_trades: [agent.config?.max_daily_trades || 10],
    })
    setIsEditDialogOpen(true)
  }

  const getAgentStrategies = (agentId: string) => {
    return strategies.filter((strategy) => strategy.agent_id === agentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Management</h2>
          <p className="text-slate-400">Create and manage your AI trading agents</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Trading Agent</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure your AI trading agent with custom parameters and strategies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Agent Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Momentum Trader Alpha"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy" className="text-slate-300">
                    Strategy Type
                  </Label>
                  <Select
                    value={formData.strategy_type}
                    onValueChange={(value) => setFormData({ ...formData, strategy_type: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {STRATEGY_TYPES.map((strategy) => (
                        <SelectItem key={strategy.value} value={strategy.value} className="text-white">
                          {strategy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the agent's purpose and strategy..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Risk Tolerance: {formData.risk_tolerance[0]}</Label>
                  <Slider
                    value={formData.risk_tolerance}
                    onValueChange={(value) => setFormData({ ...formData, risk_tolerance: value })}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Max Position Size: ${formData.position_size[0].toLocaleString()}
                  </Label>
                  <Slider
                    value={formData.position_size}
                    onValueChange={(value) => setFormData({ ...formData, position_size: value })}
                    max={100000}
                    min={1000}
                    step={1000}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Initial Balance: ${formData.initial_balance[0].toLocaleString()}
                  </Label>
                  <Slider
                    value={formData.initial_balance}
                    onValueChange={(value) => setFormData({ ...formData, initial_balance: value })}
                    max={1000000}
                    min={10000}
                    step={5000}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Daily Trades: {formData.max_daily_trades[0]}</Label>
                  <Slider
                    value={formData.max_daily_trades}
                    onValueChange={(value) => setFormData({ ...formData, max_daily_trades: value })}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Stop Loss %: {formData.stop_loss_percent[0]}%</Label>
                  <Slider
                    value={formData.stop_loss_percent}
                    onValueChange={(value) => setFormData({ ...formData, stop_loss_percent: value })}
                    max={10}
                    min={0.5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Take Profit %: {formData.take_profit_percent[0]}%</Label>
                  <Slider
                    value={formData.take_profit_percent}
                    onValueChange={(value) => setFormData({ ...formData, take_profit_percent: value })}
                    max={20}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-trade"
                  checked={formData.auto_trade}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_trade: checked })}
                />
                <Label htmlFor="auto-trade" className="text-slate-300">
                  Enable Auto Trading
                </Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-slate-600 text-slate-300"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={createAgent}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isCreating || !formData.name.trim() || !formData.strategy_type}
              >
                {isCreating ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Total Agents</p>
                <p className="text-2xl font-bold text-white">{agents.length}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Active Agents</p>
                <p className="text-2xl font-bold text-white">{agents.filter((a) => a.status === "active").length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Total Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${agents.reduce((sum, agent) => sum + agent.current_balance, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Avg Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {agents.length > 0
                    ? Math.round(
                        agents.reduce((sum, agent) => {
                          const rate = agent.total_trades > 0 ? (agent.successful_trades / agent.total_trades) * 100 : 0
                          return sum + rate
                        }, 0) / agents.length,
                      )
                    : 0}
                  %
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Trading Agents</CardTitle>
          <CardDescription className="text-slate-400">Manage and monitor your AI trading agents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Agent</TableHead>
                <TableHead className="text-slate-300">Strategy</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Balance</TableHead>
                <TableHead className="text-slate-300">Risk Level</TableHead>
                <TableHead className="text-slate-300">Performance</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const successRate = agent.total_trades > 0 ? (agent.successful_trades / agent.total_trades) * 100 : 0
                const agentStrategies = getAgentStrategies(agent.id)
                return (
                  <TableRow key={agent.id} className="border-slate-700">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{agent.name}</p>
                          <p className="text-xs text-slate-400">{agentStrategies.length} strategies</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {STRATEGY_TYPES.find((s) => s.value === agent.strategy_type)?.label || agent.strategy_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={agent.status === "active" ? "bg-green-600" : "bg-slate-600"}
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">${agent.current_balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${agent.config?.risk_tolerance * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round(agent.config?.risk_tolerance * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {successRate >= 60 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={successRate >= 60 ? "text-green-500" : "text-red-500"}>
                          {Math.round(successRate)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAgentStatus(agent.id, agent.status)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          {agent.status === "active" ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(agent)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/10 bg-transparent"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Agent</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAgent(agent.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Trading Agent</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your agent's configuration and parameters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-300">
                  Agent Name
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-strategy" className="text-slate-300">
                  Strategy Type
                </Label>
                <Select
                  value={formData.strategy_type}
                  onValueChange={(value) => setFormData({ ...formData, strategy_type: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {STRATEGY_TYPES.map((strategy) => (
                      <SelectItem key={strategy.value} value={strategy.value} className="text-white">
                        {strategy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Risk Tolerance: {formData.risk_tolerance[0]}</Label>
                <Slider
                  value={formData.risk_tolerance}
                  onValueChange={(value) => setFormData({ ...formData, risk_tolerance: value })}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Max Position Size: ${formData.position_size[0].toLocaleString()}
                </Label>
                <Slider
                  value={formData.position_size}
                  onValueChange={(value) => setFormData({ ...formData, position_size: value })}
                  max={100000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-auto-trade"
                checked={formData.auto_trade}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_trade: checked })}
              />
              <Label htmlFor="edit-auto-trade" className="text-slate-300">
                Enable Auto Trading
              </Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button onClick={updateAgent} className="bg-blue-600 hover:bg-blue-700">
              Update Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
