import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { strategyId, performanceData, marketChanges } = await request.json()

    const supabase = createClient()

    // Get current strategy
    const { data: strategy } = await supabase.from("strategies").select("*").eq("id", strategyId).single()

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    // Get recent performance data
    const { data: recentPerformance } = await supabase
      .from("strategy_performance")
      .select("*")
      .eq("strategy_id", strategyId)
      .order("created_at", { ascending: false })
      .limit(30)

    // Get recent market data
    const { data: recentMarketData } = await supabase
      .from("market_data")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50)

    const prompt = `
    You are an expert trading strategy optimizer. Analyze the current strategy performance and market conditions to suggest adaptations.
    
    Current Strategy:
    ${JSON.stringify(strategy, null, 2)}
    
    Recent Performance Data:
    ${JSON.stringify(recentPerformance?.slice(0, 10), null, 2)}
    
    Recent Market Data:
    ${JSON.stringify(recentMarketData?.slice(0, 10), null, 2)}
    
    Market Changes: ${marketChanges}
    
    Based on the performance data and changing market conditions, suggest specific adaptations to improve the strategy. Consider:
    1. Parameter adjustments (stop loss, take profit, position sizing)
    2. Entry/exit rule modifications
    3. Risk management improvements
    4. New indicators or filters to add
    5. Market condition filters
    
    Provide your response as a JSON object with:
    {
      "adaptations": [
        {
          "type": "parameter_change",
          "parameter": "stopLoss",
          "oldValue": 0.02,
          "newValue": 0.025,
          "reason": "Reduce risk due to increased volatility"
        }
      ],
      "reasoning": "Detailed explanation of why these changes are recommended",
      "expectedImprovement": "Expected performance improvement",
      "riskAssessment": "Assessment of risks with these changes"
    }
    `

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.6,
      maxTokens: 1500,
    })

    let adaptations
    try {
      adaptations = JSON.parse(text)
    } catch (error) {
      adaptations = {
        adaptations: [],
        reasoning: text,
        expectedImprovement: "Analysis provided",
        riskAssessment: "Review recommended changes carefully",
      }
    }

    // Log the adaptation suggestion
    await supabase.from("agent_collaborations").insert({
      collaboration_type: "strategy_adaptation",
      participants: [strategyId],
      data: adaptations,
      outcome: "adaptation_suggested",
    })

    return NextResponse.json({
      success: true,
      adaptations,
      strategy,
    })
  } catch (error) {
    console.error("Strategy adaptation error:", error)
    return NextResponse.json({ error: "Failed to adapt strategy" }, { status: 500 })
  }
}
