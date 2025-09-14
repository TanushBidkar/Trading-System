"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, MessageSquare, Network, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

interface Agent {
  id: string
  name: string
  strategy_type: string
  status: string
  risk_tolerance: number
}

interface Collaboration {
  id: string
  collaboration_type: string
  participants: string[]
  data: any
  outcome: string
  created_at: string
}

interface Message {
  id: string
  from_agent_id: string
  to_agent_id: string
  message_type: string
  content: any
  priority: string
  status: string
  created_at: string
  from_agent?: { name: string }
  to_agent?: { name: string }
}

interface AgentCollaborationProps {
  userId: string
}

export default function AgentCollaboration({ userId }: AgentCollaborationProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Collaboration form state
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [collaborationType, setCollaborationType] = useState("")
  const [collaborationContext, setCollaborationContext] = useState("")
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  // Communication form state
  const [fromAgent, setFromAgent] = useState("")
  const [toAgent, setToAgent] = useState("")
  const [messageType, setMessageType] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [messagePriority, setMessagePriority] = useState("normal")

  useEffect(() => {
    fetchData()

    // Set up real-time subscriptions
    const collaborationSubscription = supabase
      .channel("collaborations")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_collaborations" }, () => {
        fetchCollaborations()
      })
      .subscribe()

    const messageSubscription = supabase
      .channel("messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_communications" }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => {
      collaborationSubscription.unsubscribe()
      messageSubscription.unsubscribe()
    }
  }, [userId])

  const fetchData = async () => {
    try {
      await Promise.allSettled([fetchAgents(), fetchCollaborations(), fetchMessages()])
    } catch (error) {
      if (error instanceof Error && error.message.includes("schema cache")) {
        toast({
          title: "Database Setup Required",
          description:
            "Please run the database setup scripts first: 01-create-tables.sql, 02-seed-data.sql, 03-add-collaboration-tables.sql",
          variant: "destructive",
        })
      } else {
        console.error("Error fetching collaboration data:", error)
      }
    }
  }

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase.from("trading_agents").select("*").eq("user_id", userId)

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      if (error instanceof Error && error.message.includes("schema cache")) {
        console.warn("trading_agents table not found - database setup required")
        setAgents([])
        return
      }
      throw error
    }
  }

  const fetchCollaborations = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_collaborations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setCollaborations(data || [])
    } catch (error) {
      if (error instanceof Error && error.message.includes("schema cache")) {
        console.warn("agent_collaborations table not found - database setup required")
        setCollaborations([])
        return
      }
      throw error
    }
  }

  const fetchMessages = async () => {
    if (agents.length === 0) return

    try {
      const agentIds = agents.map((a) => a.id)
      const { data, error } = await supabase
        .from("agent_communications")
        .select(`
          *,
          from_agent:trading_agents!from_agent_id(name),
          to_agent:trading_agents!to_agent_id(name)
        `)
        .or(`from_agent_id.in.(${agentIds.join(",")}),to_agent_id.in.(${agentIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      if (error instanceof Error && error.message.includes("schema cache")) {
        console.warn("agent_communications table not found - database setup required")
        setMessages([])
        return
      }
      throw error
    }
  }

  const generateCollaborationPlan = async () => {
    if (selectedAgents.length < 2) {
      toast({
        title: "Invalid Selection",
        description: "Please select at least 2 agents for collaboration",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingPlan(true)
    try {
      const response = await fetch("/api/agents/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentIds: selectedAgents,
          collaborationType,
          context: collaborationContext,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Collaboration Plan Generated",
          description: "AI has created a collaboration strategy for your agents",
        })
        fetchCollaborations()
        setSelectedAgents([])
        setCollaborationType("")
        setCollaborationContext("")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate collaboration plan",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const sendMessage = async () => {
    if (!fromAgent || !toAgent || !messageType || !messageContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/agents/communicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAgentId: fromAgent,
          toAgentId: toAgent,
          messageType,
          content: { message: messageContent },
          priority: messagePriority,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Message Sent",
          description: "Communication sent successfully",
        })
        fetchMessages()
        setFromAgent("")
        setToAgent("")
        setMessageType("")
        setMessageContent("")
        setMessagePriority("normal")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      default:
        return "text-green-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">Agent Collaboration</h2>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Brain className="h-4 w-4 mr-2" />
                Create Collaboration
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Agent Collaboration</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Generate AI-powered collaboration strategies for your trading agents
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Select Agents (minimum 2)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {agents.map((agent) => (
                      <label key={agent.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAgents([...selectedAgents, agent.id])
                            } else {
                              setSelectedAgents(selectedAgents.filter((id) => id !== agent.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-slate-300 text-sm">{agent.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Collaboration Type</Label>
                  <Select value={collaborationType} onValueChange={setCollaborationType}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select collaboration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portfolio_optimization">Portfolio Optimization</SelectItem>
                      <SelectItem value="risk_management">Risk Management</SelectItem>
                      <SelectItem value="market_analysis">Market Analysis</SelectItem>
                      <SelectItem value="strategy_coordination">Strategy Coordination</SelectItem>
                      <SelectItem value="information_sharing">Information Sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Context & Objectives</Label>
                  <Textarea
                    placeholder="Describe the collaboration goals and current market context..."
                    value={collaborationContext}
                    onChange={(e) => setCollaborationContext(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    rows={3}
                  />
                </div>
                <Button onClick={generateCollaborationPlan} disabled={isGeneratingPlan} className="w-full">
                  {isGeneratingPlan ? "Generating Plan..." : "Generate Collaboration Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Send Agent Message</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Send direct communication between trading agents
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">From Agent</Label>
                    <Select value={fromAgent} onValueChange={setFromAgent}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select sender" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">To Agent</Label>
                    <Select value={toAgent} onValueChange={setToAgent}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents
                          .filter((a) => a.id !== fromAgent)
                          .map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Message Type</Label>
                    <Select value={messageType} onValueChange={setMessageType}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market_alert">Market Alert</SelectItem>
                        <SelectItem value="strategy_update">Strategy Update</SelectItem>
                        <SelectItem value="risk_warning">Risk Warning</SelectItem>
                        <SelectItem value="coordination">Coordination</SelectItem>
                        <SelectItem value="information">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Priority</Label>
                    <Select value={messagePriority} onValueChange={setMessagePriority}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Message Content</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    rows={3}
                  />
                </div>
                <Button onClick={sendMessage} className="w-full">
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="collaborations" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="collaborations">Active Collaborations</TabsTrigger>
          <TabsTrigger value="messages">Communications</TabsTrigger>
          <TabsTrigger value="network">Network View</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations" className="space-y-6">
          <div className="grid gap-6">
            {collaborations.map((collab) => (
              <Card key={collab.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {collab.collaboration_type.replace("_", " ").toUpperCase()}
                    </CardTitle>
                    <Badge variant={collab.outcome === "active" ? "default" : "secondary"}>{collab.outcome}</Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    Created {formatDate(collab.created_at)} • {collab.participants.length} agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {collab.data?.collaborationPlan && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Strategy</h4>
                        <p className="text-slate-300 text-sm">{collab.data.collaborationPlan.strategy}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Coordination Actions</h4>
                          <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                            {collab.data.collaborationPlan.coordination?.map((action: string, index: number) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Opportunities</h4>
                          <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                            {collab.data.collaborationPlan.opportunities?.map((opp: string, index: number) => (
                              <li key={index}>{opp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">Success Metrics</h4>
                        <div className="flex flex-wrap gap-2">
                          {collab.data.successMetrics?.map((metric: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Agent Communications</CardTitle>
              <CardDescription className="text-slate-400">
                Real-time message exchange between trading agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">From</TableHead>
                    <TableHead className="text-slate-300">To</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Priority</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Time</TableHead>
                    <TableHead className="text-slate-300">Content</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id} className="border-slate-700">
                      <TableCell className="text-white">{message.from_agent?.name || "Unknown"}</TableCell>
                      <TableCell className="text-white">{message.to_agent?.name || "Unknown"}</TableCell>
                      <TableCell className="text-slate-300">{message.message_type}</TableCell>
                      <TableCell className={getPriorityColor(message.priority)}>
                        {message.priority.toUpperCase()}
                      </TableCell>
                      <TableCell>{getStatusIcon(message.status)}</TableCell>
                      <TableCell className="text-slate-300">{formatDate(message.created_at)}</TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {typeof message.content === "object" ? message.content.message : message.content}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Collaboration Network</CardTitle>
              <CardDescription className="text-slate-400">
                Visual representation of agent interactions and collaborations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{agent.strategy_type}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Risk: {agent.risk_tolerance}%</span>
                        <span>•</span>
                        <span>
                          {messages.filter((m) => m.from_agent_id === agent.id || m.to_agent_id === agent.id).length}{" "}
                          messages
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
