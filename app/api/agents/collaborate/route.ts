import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { agentIds, collaborationType, context } = await request.json()

    const supabase = createClient()

    // Get agent details
    const { data: agents } = await supabase.from("trading_agents").select("*").in("id", agentIds)

    if (!agents || agents.length < 2) {
      return NextResponse.json({ error: "Need at least 2 agents for collaboration" }, { status: 400 })
    }

    // Get recent performance data for context
    const { data: performance } = await supabase
      .from("strategy_performance")
      .select("*, strategies(*)")
      .in(
        "strategy_id",
        agents.map((a) => a.strategy_id),
      )
      .order("created_at", { ascending: false })
      .limit(20)

    // Get current market conditions
    const { data: marketData } = await supabase
      .from("market_data")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10)

    const prompt = `
    You are facilitating collaboration between multiple trading agents. Analyze their strategies and current market conditions to provide collaboration recommendations.

    Agents:
    ${JSON.stringify(agents, null, 2)}

    Recent Performance:
    ${JSON.stringify(performance?.slice(0, 5), null, 2)}

    Current Market Data:
    ${JSON.stringify(marketData?.slice(0, 5), null, 2)}

    Collaboration Type: ${collaborationType}
    Context: ${context}

    Based on the agents' strategies, performance, and current market conditions, provide collaboration recommendations:

    1. How should these agents coordinate their trading activities?
    2. What information should they share with each other?
    3. Are there any conflicts in their strategies that need resolution?
    4. What collaborative opportunities exist for portfolio optimization?
    5. What are the risks of their collaboration?

    Provide your response as a JSON object:
    {
      "collaborationPlan": {
        "strategy": "Overall collaboration strategy",
        "coordination": ["specific coordination actions"],
        "informationSharing": ["what data to share"],
        "conflictResolution": ["how to resolve conflicts"],
        "opportunities": ["collaborative opportunities"],
        "risks": ["potential risks"],
        "timeline": "recommended timeline"
      },
      "agentRoles": {
        "agent_id": "specific role and responsibilities"
      },
      "communicationProtocol": {
        "frequency": "how often to communicate",
        "triggers": ["events that trigger communication"],
        "channels": ["communication methods"]
      },
      "successMetrics": ["how to measure collaboration success"]
    }
    `

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    let collaborationPlan
    try {
      collaborationPlan = JSON.parse(text)
    } catch (error) {
      collaborationPlan = {
        collaborationPlan: {
          strategy: "AI-generated collaboration strategy",
          coordination: ["Coordinate entry/exit timing", "Share market analysis"],
          informationSharing: ["Performance metrics", "Risk assessments"],
          conflictResolution: ["Majority voting", "Risk-weighted decisions"],
          opportunities: ["Portfolio diversification", "Risk reduction"],
          risks: ["Over-correlation", "Communication delays"],
          timeline: "Ongoing with weekly reviews",
        },
        agentRoles: {},
        communicationProtocol: {
          frequency: "Real-time for critical decisions, daily for updates",
          triggers: ["Market volatility > 2%", "Position conflicts"],
          channels: ["Direct API calls", "Database updates"],
        },
        successMetrics: ["Improved Sharpe ratio", "Reduced portfolio volatility"],
      }
    }

    // Log the collaboration
    const { data: collaboration, error } = await supabase
      .from("agent_collaborations")
      .insert({
        collaboration_type: collaborationType,
        participants: agentIds,
        data: collaborationPlan,
        outcome: "plan_generated",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      collaboration,
      plan: collaborationPlan,
    })
  } catch (error) {
    console.error("Collaboration error:", error)
    return NextResponse.json({ error: "Failed to generate collaboration plan" }, { status: 500 })
  }
}
