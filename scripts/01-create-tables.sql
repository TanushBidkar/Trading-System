-- Multi-Agent Trading System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading agents table
CREATE TABLE IF NOT EXISTS trading_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  strategy_type VARCHAR(50) NOT NULL, -- 'momentum', 'mean_reversion', 'arbitrage', 'sentiment'
  status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'paused'
  risk_tolerance DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  max_position_size DECIMAL(15,2) DEFAULT 10000,
  current_balance DECIMAL(15,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  configuration JSONB DEFAULT '{}', -- Agent-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading strategies table
CREATE TABLE IF NOT EXISTS trading_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  strategy_code TEXT, -- AI-generated strategy logic
  parameters JSONB DEFAULT '{}',
  performance_score DECIMAL(5,2) DEFAULT 0,
  total_return DECIMAL(10,4) DEFAULT 0,
  sharpe_ratio DECIMAL(6,4) DEFAULT 0,
  max_drawdown DECIMAL(6,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio positions table
CREATE TABLE IF NOT EXISTS portfolio_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  average_price DECIMAL(15,8) NOT NULL,
  current_price DECIMAL(15,8),
  market_value DECIMAL(15,2),
  unrealized_pnl DECIMAL(15,2),
  position_type VARCHAR(10) DEFAULT 'long', -- 'long', 'short'
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading orders table
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES trading_strategies(id) ON DELETE SET NULL,
  symbol VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL, -- 'market', 'limit', 'stop_loss', 'take_profit'
  side VARCHAR(10) NOT NULL, -- 'buy', 'sell'
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8),
  filled_quantity DECIMAL(15,8) DEFAULT 0,
  filled_price DECIMAL(15,8),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'filled', 'cancelled', 'rejected'
  reason TEXT, -- AI reasoning for the trade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data table for historical prices
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  open_price DECIMAL(15,8) NOT NULL,
  high_price DECIMAL(15,8) NOT NULL,
  low_price DECIMAL(15,8) NOT NULL,
  close_price DECIMAL(15,8) NOT NULL,
  volume DECIMAL(20,8) NOT NULL,
  timeframe VARCHAR(10) NOT NULL, -- '1m', '5m', '1h', '1d'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, timestamp, timeframe)
);

-- Agent collaboration logs
CREATE TABLE IF NOT EXISTS agent_collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  target_agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  collaboration_type VARCHAR(50) NOT NULL, -- 'strategy_share', 'risk_alert', 'market_insight'
  message TEXT,
  data JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- AI strategy adaptations log
CREATE TABLE IF NOT EXISTS strategy_adaptations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES trading_strategies(id) ON DELETE CASCADE,
  adaptation_reason TEXT NOT NULL,
  old_parameters JSONB,
  new_parameters JSONB,
  market_conditions JSONB, -- Market volatility, trends, etc.
  performance_impact DECIMAL(6,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_return DECIMAL(10,4) NOT NULL,
  daily_return DECIMAL(10,4) NOT NULL,
  volatility DECIMAL(6,4),
  sharpe_ratio DECIMAL(6,4),
  max_drawdown DECIMAL(6,4),
  win_rate DECIMAL(5,2),
  profit_factor DECIMAL(6,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_agents_user_id ON trading_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_agents_status ON trading_agents(status);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_agent_id ON trading_strategies(agent_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_agent_id ON portfolio_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_agent_id ON trading_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_agents ON agent_collaborations(initiator_agent_id, target_agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agent_date ON performance_metrics(agent_id, date);
