"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Zap, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface GeneratedStrategy {
  name: string
  description: string
  entryRules: string[]
  exitRules: string[]
  riskParameters: {
    maxPositionSize: number
    stopLoss: number
    takeProfit: number
  }
  indicators: string[]
  marketConditions: string[]
  expectedReturn: number
  maxDrawdown: number
  implementation: string
}

interface StrategyAdaptation {
  adaptations: Array<{
    type: string
    parameter: string
    oldValue: any
    newValue: any
    reason: string
  }>
  reasoning: string
  expectedImprovement: string
  riskAssessment: string
}

export default function AIStrategyGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAdapting, setIsAdapting] = useState(false)
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null)
  const [adaptations, setAdaptations] = useState<StrategyAdaptation | null>(null)

  // Generation form state
  const [marketConditions, setMarketConditions] = useState("")
  const [riskTolerance, setRiskTolerance] = useState([50])
  const [strategyType, setStrategyType] = useState("")

  // Adaptation form state
  const [selectedStrategyId, setSelectedStrategyId] = useState("")
  const [marketChanges, setMarketChanges] = useState("")

  const handleGenerateStrategy = async () => {
    if (!marketConditions || !strategyType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketConditions,
          riskTolerance: riskTolerance[0],
          strategyType,
          historicalData: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedStrategy(data.aiGenerated)
        toast({
          title: "Strategy Generated!",
          description: "AI has created a new trading strategy based on your parameters",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate strategy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAdaptStrategy = async () => {
    if (!selectedStrategyId || !marketChanges) {
      toast({
        title: "Missing Information",
        description: "Please select a strategy and describe market changes",
        variant: "destructive",
      })
      return
    }

    setIsAdapting(true)
    try {
      const response = await fetch("/api/ai/adapt-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: selectedStrategyId,
          marketChanges,
          performanceData: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAdaptations(data.adaptations)
        toast({
          title: "Strategy Adapted!",
          description: "AI has analyzed performance and suggested improvements",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Adaptation Failed",
        description: "Failed to adapt strategy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdapting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">AI Strategy Generator</h2>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate New Strategy</TabsTrigger>
          <TabsTrigger value="adapt">Adapt Existing Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Strategy Generation Parameters
              </CardTitle>
              <CardDescription>Provide market context and preferences for AI strategy generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-type">Strategy Type</Label>
                  <Select value={strategyType} onValueChange={setStrategyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum">Momentum Trading</SelectItem>
                      <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                      <SelectItem value="breakout">Breakout Strategy</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      <SelectItem value="pairs_trading">Pairs Trading</SelectItem>
                      <SelectItem value="trend_following">Trend Following</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risk Tolerance: {riskTolerance[0]}%</Label>
                  <Slider
                    value={riskTolerance}
                    onValueChange={setRiskTolerance}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="market-conditions">Current Market Conditions</Label>
                <Textarea
                  id="market-conditions"
                  placeholder="Describe current market conditions, volatility, trends, economic factors..."
                  value={marketConditions}
                  onChange={(e) => setMarketConditions(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleGenerateStrategy} disabled={isGenerating} className="w-full">
                {isGenerating ? "Generating Strategy..." : "Generate AI Strategy"}
              </Button>
            </CardContent>
          </Card>

          {generatedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Generated Strategy: {generatedStrategy.name}
                </CardTitle>
                <CardDescription>{generatedStrategy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Entry Rules</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {generatedStrategy.entryRules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Exit Rules</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {generatedStrategy.exitRules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {(generatedStrategy.expectedReturn * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Expected Return</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {(generatedStrategy.maxDrawdown * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {(generatedStrategy.riskParameters.maxPositionSize * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Position Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {(generatedStrategy.riskParameters.stopLoss * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Stop Loss</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Technical Indicators</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedStrategy.indicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Implementation Code</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{generatedStrategy.implementation}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="adapt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Strategy Adaptation
              </CardTitle>
              <CardDescription>
                Analyze performance and adapt existing strategies to changing market conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy-select">Select Strategy to Adapt</Label>
                <Input
                  id="strategy-select"
                  placeholder="Enter strategy ID"
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="market-changes">Market Changes & Performance Issues</Label>
                <Textarea
                  id="market-changes"
                  placeholder="Describe recent market changes, performance issues, or new conditions..."
                  value={marketChanges}
                  onChange={(e) => setMarketChanges(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleAdaptStrategy} disabled={isAdapting} className="w-full">
                {isAdapting ? "Analyzing & Adapting..." : "Adapt Strategy with AI"}
              </Button>
            </CardContent>
          </Card>

          {adaptations && (
            <Card>
              <CardHeader>
                <CardTitle>AI Strategy Adaptations</CardTitle>
                <CardDescription>{adaptations.reasoning}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {adaptations.adaptations.map((adaptation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{adaptation.type}</Badge>
                        <span className="text-sm font-medium">{adaptation.parameter}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Old Value:</span>
                          <span className="ml-2 font-mono">{JSON.stringify(adaptation.oldValue)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">New Value:</span>
                          <span className="ml-2 font-mono">{JSON.stringify(adaptation.newValue)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{adaptation.reason}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Expected Improvement</h4>
                    <p className="text-sm">{adaptations.expectedImprovement}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Risk Assessment</h4>
                    <p className="text-sm">{adaptations.riskAssessment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
