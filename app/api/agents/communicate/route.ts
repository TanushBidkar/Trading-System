import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { fromAgentId, toAgentId, messageType, content, priority } = await request.json()

    const supabase = createClient()

    // Create communication record
    const { data: message, error } = await supabase
      .from("agent_communications")
      .insert({
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        message_type: messageType,
        content,
        priority: priority || "normal",
        status: "sent",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // If it's a high priority message, trigger immediate processing
    if (priority === "high") {
      await processHighPriorityMessage(message)
    }

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("Communication error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get messages for this agent
    const { data: messages, error } = await supabase
      .from("agent_communications")
      .select(`
        *,
        from_agent:trading_agents!from_agent_id(name),
        to_agent:trading_agents!to_agent_id(name)
      `)
      .or(`from_agent_id.eq.${agentId},to_agent_id.eq.${agentId}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}

async function processHighPriorityMessage(message: any) {
  // Process high priority messages immediately
  // This could trigger alerts, automatic responses, etc.
  console.log("Processing high priority message:", message)
}
