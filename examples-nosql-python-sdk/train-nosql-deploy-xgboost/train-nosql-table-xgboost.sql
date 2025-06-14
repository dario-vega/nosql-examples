CREATE TABLE IF NOT EXISTS ProductData (
  sku String,
  parent_sku String,
  type String,
  primary_supplier String,
  product_name String,
  rrp DOUBLE,
  brand String,
  category String,
  days_since_added Integer,
  days_since_last_received Integer,
  qty_sold Integer,
  revenue DOUBLE,
  stock Integer,
  soh Integer,
  days_since_last_sold Integer,
  average_days_between_sales DOUBLE,
  Days_OOS Integer,
  sell_through_rate String,
  demand_forecast_days_cover DOUBLE,
  demand_forecast_weeks_cover DOUBLE,
  stock_value DOUBLE,
  stock_cost DOUBLE,
  stock_margin DOUBLE,
  orders_last_7_days Integer,
  orders_last_14_days Integer,
  orders_last_30_days Integer,
  orders_last_60_days Integer,
  rev_last_30_days DOUBLE,
  Lost_Revenue DOUBLE,
  Quartile_30Days Integer,
  product_bucket String,
  stock_bucket String,
  age_buckets String,
  reach_buckets String,
  conversion_rate DOUBLE,
  PRIMARY KEY (sku)                                   
)