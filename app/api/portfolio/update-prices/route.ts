import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get all unique symbols from portfolio positions
    const { data: positions } = await supabase.from("portfolio_positions").select("symbol").neq("quantity", 0)

    if (!positions || positions.length === 0) {
      return NextResponse.json({ success: true, message: "No positions to update" })
    }

    const uniqueSymbols = [...new Set(positions.map((p) => p.symbol))]

    // Fetch current market prices
    const marketResponse = await fetch(`${request.nextUrl.origin}/api/market/live-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: uniqueSymbols }),
    })

    const marketData = await marketResponse.json()

    if (!marketData.success) {
      throw new Error("Failed to fetch market data")
    }

    // Update portfolio positions with current prices
    const updates = await Promise.all(
      marketData.data.map(async (market: any) => {
        const { data: positionsToUpdate } = await supabase
          .from("portfolio_positions")
          .select("*")
          .eq("symbol", market.symbol)
          .neq("quantity", 0)

        if (positionsToUpdate && positionsToUpdate.length > 0) {
          const updatePromises = positionsToUpdate.map((position) => {
            const currentPrice = market.close_price
            const marketValue = position.quantity * currentPrice
            const unrealizedPnL = (currentPrice - position.average_price) * position.quantity

            return supabase
              .from("portfolio_positions")
              .update({
                current_price: currentPrice,
                market_value: marketValue,
                unrealized_pnl: unrealizedPnL,
                updated_at: new Date().toISOString(),
              })
              .eq("id", position.id)
          })

          return Promise.all(updatePromises)
        }
        return []
      }),
    )

    return NextResponse.json({
      success: true,
      message: "Portfolio prices updated",
      updatedSymbols: uniqueSymbols.length,
    })
  } catch (error) {
    console.error("Portfolio update error:", error)
    return NextResponse.json({ error: "Failed to update portfolio prices" }, { status: 500 })
  }
}
