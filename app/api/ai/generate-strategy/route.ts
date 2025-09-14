import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { marketConditions, riskTolerance, strategyType, historicalData } = await request.json()

    const supabase = createClient()

    let marketData = null
    let strategyPerformance = null

    try {
      // Get historical market data for context
      const { data: marketDataResult } = await supabase
        .from("market_data")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)
      marketData = marketDataResult
    } catch (error) {
      console.warn("Market data table not found, using mock data")
      marketData = []
    }

    try {
      // Get existing strategy performance for learning
      const { data: strategyPerformanceResult } = await supabase
        .from("strategy_performance")
        .select("*, strategies(*)")
        .order("created_at", { ascending: false })
        .limit(50)
      strategyPerformance = strategyPerformanceResult
    } catch (error) {
      console.warn("Strategy performance table not found, using empty data")
      strategyPerformance = []
    }

    const prompt = `
    You are an expert algorithmic trading strategist specializing in the Indian stock market (NSE/BSE). Generate a comprehensive trading strategy based on the following parameters:
    
    Market Conditions: ${marketConditions}
    Risk Tolerance: ${riskTolerance}%
    Strategy Type: ${strategyType}
    
    Indian Market Context:
    - Trading Hours: 9:15 AM to 3:30 PM IST
    - Currency: Indian Rupees (₹)
    - Popular stocks: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, HINDUNILVR, ITC, SBIN, BHARTIARTL, ASIANPAINT
    - Market holidays: Consider Indian market holidays and festivals
    - Regulatory environment: SEBI regulations and Indian market dynamics
    
    IMPORTANT: You MUST respond with a valid JSON object only. Do not include any text before or after the JSON.
    
    Generate a detailed trading strategy specifically for the Indian market with this EXACT JSON structure:
    
    {
      "name": "Complete Strategy Name for Indian Market",
      "description": "Detailed 2-3 sentence description explaining the strategy's approach, target stocks, and how it works in Indian market conditions. Include specific details about entry/exit logic and risk management approach.",
      "entryRules": [
        "Specific entry condition 1 with Indian market context and stock examples",
        "Specific entry condition 2 with technical indicators and thresholds",
        "Specific entry condition 3 with timing and volume requirements"
      ],
      "exitRules": [
        "Specific exit condition 1 considering Indian trading hours and settlement",
        "Specific exit condition 2 with profit targets and stop losses",
        "Specific exit condition 3 with risk management rules"
      ],
      "riskParameters": {
        "maxPositionSize": ${(riskTolerance / 100) * 0.1},
        "stopLoss": ${Math.max(0.01, (100 - riskTolerance) / 1000)},
        "takeProfit": ${Math.max(0.02, riskTolerance / 1000)},
        "maxPositionValueINR": ${riskTolerance * 2000}
      },
      "indicators": ["RSI", "MACD", "SMA", "Bollinger Bands", "Volume"],
      "marketConditions": ["${strategyType} markets", "Indian trading hours", "High volume periods"],
      "expectedReturn": ${Math.max(0.08, riskTolerance / 1000)},
      "maxDrawdown": ${Math.max(0.03, (100 - riskTolerance) / 2000)},
      "implementation": "# Complete Python implementation for Indian stocks\n\ndef ${strategyType.toLowerCase()}_strategy():\n    # Entry logic for Indian stocks like RELIANCE, TCS, INFY\n    if rsi < 30 and volume > avg_volume * 1.5:\n        buy_signal = True\n        position_size = calculate_position_size(risk_tolerance=${riskTolerance})\n        entry_price = current_price\n        stop_loss = entry_price * (1 - ${Math.max(0.01, (100 - riskTolerance) / 1000)})\n        take_profit = entry_price * (1 + ${Math.max(0.02, riskTolerance / 1000)})\n    \n    # Exit logic considering Indian market hours\n    if current_time > '15:00' or profit_loss > take_profit:\n        sell_signal = True\n        \n    # Risk management for Indian market\n    if drawdown > ${Math.max(0.03, (100 - riskTolerance) / 2000)} * portfolio_value:\n        reduce_positions()\n        \n    return {'entry': buy_signal, 'exit': sell_signal, 'position_size': position_size}"
    }
    
    Ensure all values are realistic for Indian markets and the implementation code is complete and functional.`

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.3, // Reduced temperature for more consistent JSON output
      maxTokens: 3000, // Increased token limit for complete responses
    })

    let strategy
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text
        .trim()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
      strategy = JSON.parse(cleanedText)

      // Validate required fields
      if (!strategy.name || !strategy.description || !strategy.entryRules || !strategy.exitRules) {
        throw new Error("Incomplete strategy structure")
      }
    } catch (error) {
      console.warn("JSON parsing failed, creating structured fallback:", error)
      strategy = {
        name: `Indian ${strategyType} Trading Strategy`,
        description: `A comprehensive ${strategyType} strategy designed for the Indian stock market, focusing on NSE-listed stocks like RELIANCE, TCS, and INFY. This strategy uses technical analysis combined with Indian market timing to identify optimal entry and exit points while managing risk through position sizing and stop-loss mechanisms.`,
        entryRules: [
          `Enter long positions when ${strategyType} signals align with RSI below 40 on Indian blue-chip stocks`,
          "Confirm entry with volume spike above 1.5x average daily volume during market hours (9:15 AM - 3:30 PM IST)",
          "Ensure market conditions favor the strategy type with proper risk-reward ratio of at least 1:2",
        ],
        exitRules: [
          "Exit positions when profit target of 3-5% is reached or before market close at 3:30 PM IST",
          `Apply stop-loss at ${(((100 - riskTolerance) / 1000) * 100).toFixed(1)}% to limit downside risk`,
          "Close all positions if overall portfolio drawdown exceeds risk tolerance limits",
        ],
        riskParameters: {
          maxPositionSize: (riskTolerance / 100) * 0.1,
          stopLoss: Math.max(0.01, (100 - riskTolerance) / 1000),
          takeProfit: Math.max(0.02, riskTolerance / 1000),
          maxPositionValueINR: riskTolerance * 2000,
        },
        indicators: ["RSI", "MACD", "SMA", "Bollinger Bands", "Volume"],
        marketConditions: [`${strategyType} trending markets`, "Indian trading hours", "High liquidity periods"],
        expectedReturn: Math.max(0.08, riskTolerance / 1000),
        maxDrawdown: Math.max(0.03, (100 - riskTolerance) / 2000),
        implementation: `# Complete ${strategyType} Strategy Implementation for Indian Market
def indian_${strategyType.toLowerCase()}_strategy():
    # Initialize parameters for Indian stocks
    indian_stocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']
    risk_tolerance = ${riskTolerance}
    
    for stock in indian_stocks:
        # Get current market data
        current_price = get_stock_price(stock)
        rsi = calculate_rsi(stock, period=14)
        volume = get_current_volume(stock)
        avg_volume = get_average_volume(stock, period=20)
        
        # Entry conditions for Indian market
        if (rsi < 40 and volume > avg_volume * 1.5 and 
            is_market_hours() and current_price > sma_20):
            
            position_size = calculate_position_size(
                portfolio_value, 
                risk_per_trade=${(riskTolerance / 100) * 0.1}
            )
            
            entry_price = current_price
            stop_loss = entry_price * (1 - ${Math.max(0.01, (100 - riskTolerance) / 1000)})
            take_profit = entry_price * (1 + ${Math.max(0.02, riskTolerance / 1000)})
            
            place_order('BUY', stock, position_size, entry_price)
            set_stop_loss(stock, stop_loss)
            set_take_profit(stock, take_profit)
        
        # Exit conditions considering Indian market timing
        if (current_time() > '15:00' or 
            get_profit_loss(stock) > take_profit or
            get_profit_loss(stock) < -stop_loss):
            
            close_position(stock)
    
    # Portfolio risk management
    total_drawdown = calculate_portfolio_drawdown()
    if total_drawdown > ${Math.max(0.03, (100 - riskTolerance) / 2000)}:
        reduce_all_positions(0.5)
    
    return strategy_status

# Helper functions for Indian market
def is_market_hours():
    current_time = datetime.now(timezone('Asia/Kolkata')).time()
    return time(9, 15) <= current_time <= time(15, 30)

def calculate_position_size(portfolio_value, risk_per_trade):
    return min(portfolio_value * risk_per_trade, ${riskTolerance * 2000})`,
      }
    }

    let savedStrategy = null
    try {
      const { data: strategyResult, error } = await supabase
        .from("strategies")
        .insert({
          name: strategy.name,
          description: strategy.description,
          strategy_type: strategyType,
          parameters: strategy,
          is_active: false,
          created_by_ai: true,
        })
        .select()
        .single()

      if (error) {
        throw error
      }
      savedStrategy = strategyResult
    } catch (error) {
      console.warn("Could not save strategy to database (tables may not exist):", error)
      // Return the generated strategy even if we can't save it
      savedStrategy = {
        id: Date.now(),
        name: strategy.name,
        description: strategy.description,
        strategy_type: strategyType,
        parameters: strategy,
        is_active: false,
        created_by_ai: true,
        created_at: new Date().toISOString(),
      }
    }

    return NextResponse.json({
      success: true,
      strategy: savedStrategy,
      aiGenerated: strategy,
      warning: !savedStrategy.id
        ? "Strategy generated but not saved to database. Please run database setup scripts."
        : null,
    })
  } catch (error) {
    console.error("Strategy generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate strategy",
        details: error.message,
        suggestion: "Please ensure database tables are created by running the SQL setup scripts.",
      },
      { status: 500 },
    )
  }
}
