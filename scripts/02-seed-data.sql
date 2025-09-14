-- Seed data for Multi-Agent Trading System - Indian Market

-- Insert sample market data for popular Indian stocks (NSE)
INSERT INTO market_data (symbol, timestamp, open_price, high_price, low_price, close_price, volume, timeframe) VALUES
-- Updated to Indian stock symbols with INR prices
('RELIANCE', NOW() - INTERVAL '1 day', 2450.00, 2480.00, 2430.00, 2465.50, 1000000, '1d'),
('TCS', NOW() - INTERVAL '1 day', 3650.00, 3680.00, 3620.00, 3670.25, 500000, '1d'),
('INFY', NOW() - INTERVAL '1 day', 1520.00, 1540.00, 1510.00, 1535.75, 800000, '1d'),
('HDFCBANK', NOW() - INTERVAL '1 day', 1680.00, 1695.00, 1670.00, 1685.50, 2000000, '1d'),
('ICICIBANK', NOW() - INTERVAL '1 day', 950.00, 965.00, 945.00, 958.25, 1500000, '1d'),
('HINDUNILVR', NOW() - INTERVAL '1 day', 2380.00, 2395.00, 2370.00, 2385.25, 900000, '1d'),
('ITC', NOW() - INTERVAL '1 day', 420.00, 425.00, 418.00, 423.50, 700000, '1d'),
('SBIN', NOW() - INTERVAL '1 day', 580.00, 590.00, 575.00, 585.25, 600000, '1d'),
('BHARTIARTL', NOW() - INTERVAL '1 day', 1180.00, 1195.00, 1175.00, 1188.75, 1200000, '1d'),
('ASIANPAINT', NOW() - INTERVAL '1 day', 3250.00, 3280.00, 3240.00, 3265.50, 400000, '1d');

-- Insert current day data for Indian stocks
INSERT INTO market_data (symbol, timestamp, open_price, high_price, low_price, close_price, volume, timeframe) VALUES
-- Current day data for Indian stocks
('RELIANCE', NOW(), 2465.50, 2485.00, 2450.00, 2475.25, 800000, '1d'),
('TCS', NOW(), 3670.25, 3690.00, 3660.00, 3682.50, 400000, '1d'),
('INFY', NOW(), 1535.75, 1545.00, 1530.00, 1542.25, 600000, '1d'),
('HDFCBANK', NOW(), 1685.50, 1695.00, 1680.00, 1690.75, 1800000, '1d'),
('ICICIBANK', NOW(), 958.25, 968.00, 952.00, 962.50, 1200000, '1d'),
('HINDUNILVR', NOW(), 2385.25, 2395.00, 2380.00, 2390.75, 750000, '1d'),
('ITC', NOW(), 423.50, 428.00, 421.00, 426.25, 550000, '1d'),
('SBIN', NOW(), 585.25, 592.00, 582.00, 588.50, 500000, '1d'),
('BHARTIARTL', NOW(), 1188.75, 1195.00, 1185.00, 1192.25, 900000, '1d'),
('ASIANPAINT', NOW(), 3265.50, 3275.00, 3260.00, 3270.25, 350000, '1d');
