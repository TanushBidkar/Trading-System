import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const NSE_API_BASE_URL = "https://www.nseindia.com/api"

const TRACKED_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "SBIN",
  "BHARTIARTL",
  "ASIANPAINT",
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (symbol) {
      // Get specific symbol data
      const data = await fetchSymbolData(symbol)
      return NextResponse.json({ success: true, data })
    } else {
      // Get all tracked symbols
      const allData = await Promise.all(
        TRACKED_SYMBOLS.map(async (sym) => {
          try {
            return await fetchSymbolData(sym)
          } catch (error) {
            console.error(`Error fetching ${sym}:`, error)
            return null
          }
        }),
      )

      const validData = allData.filter(Boolean)

      // Store in database
      if (validData.length > 0) {
        try {
          await supabase.from("market_data").upsert(
            validData.map((data) => ({
              symbol: data.symbol,
              open_price: data.open_price,
              high_price: data.high_price,
              low_price: data.low_price,
              close_price: data.close_price,
              volume: data.volume,
              timestamp: new Date().toISOString(),
              timeframe: "1d",
            })),
          )
        } catch (dbError) {
          console.warn("Database not ready, continuing with mock data:", dbError)
        }
      }

      return NextResponse.json({ success: true, data: validData })
    }
  } catch (error) {
    console.error("Market data fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 })
  }
}

async function fetchSymbolData(symbol: string) {
  // In production, you would integrate with NSE API or other Indian market data providers
  const indianStockPrices = {
    RELIANCE: { base: 2470, range: 50 },
    TCS: { base: 3675, range: 80 },
    INFY: { base: 1540, range: 30 },
    HDFCBANK: { base: 1690, range: 40 },
    ICICIBANK: { base: 960, range: 25 },
    HINDUNILVR: { base: 2390, range: 30 },
    ITC: { base: 425, range: 15 },
    SBIN: { base: 588, range: 20 },
    BHARTIARTL: { base: 1190, range: 25 },
    ASIANPAINT: { base: 3270, range: 40 },
  }

  const stockInfo = indianStockPrices[symbol] || { base: 1000, range: 50 }
  const basePrice = stockInfo.base + (Math.random() - 0.5) * stockInfo.range
  const change = (Math.random() - 0.5) * 20

  return {
    symbol,
    open_price: basePrice - change * 0.5,
    high_price: basePrice + Math.random() * 10,
    low_price: basePrice - Math.random() * 10,
    close_price: basePrice + change,
    volume: Math.floor(Math.random() * 2000000) + 100000,
    change,
    change_percent: `${((change / basePrice) * 100).toFixed(2)}%`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()
    const supabase = createClient()

    const data = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          return await fetchSymbolData(symbol)
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error)
          return null
        }
      }),
    )

    const validData = data.filter(Boolean)

    // Update database
    if (validData.length > 0) {
      try {
        await supabase.from("market_data").upsert(
          validData.map((item) => ({
            symbol: item.symbol,
            open_price: item.open_price,
            high_price: item.high_price,
            low_price: item.low_price,
            close_price: item.close_price,
            volume: item.volume,
            timestamp: new Date().toISOString(),
            timeframe: "1d",
          })),
        )
      } catch (dbError) {
        console.warn("Database not ready, continuing with mock data:", dbError)
      }
    }

    return NextResponse.json({ success: true, data: validData })
  } catch (error) {
    console.error("Market data update error:", error)
    return NextResponse.json({ error: "Failed to update market data" }, { status: 500 })
  }
}
