-- Add agent communications table if not exists
CREATE TABLE IF NOT EXISTS agent_communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  to_agent_id UUID REFERENCES trading_agents(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_communications_from_agent ON agent_communications(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_communications_to_agent ON agent_communications(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_communications_created_at ON agent_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_communications_priority ON agent_communications(priority);

-- Add some sample communications
INSERT INTO agent_communications (from_agent_id, to_agent_id, message_type, content, priority) 
SELECT 
  a1.id,
  a2.id,
  'market_alert',
  '{"message": "High volatility detected in tech sector, consider reducing exposure"}',
  'high'
FROM trading_agents a1, trading_agents a2 
WHERE a1.id != a2.id 
AND a1.strategy_type = 'momentum' 
AND a2.strategy_type = 'mean_reversion'
LIMIT 5;

INSERT INTO agent_communications (from_agent_id, to_agent_id, message_type, content, priority) 
SELECT 
  a1.id,
  a2.id,
  'coordination',
  '{"message": "Coordinating entry timing for AAPL position to avoid market impact"}',
  'normal'
FROM trading_agents a1, trading_agents a2 
WHERE a1.id != a2.id 
LIMIT 3;
