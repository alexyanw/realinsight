class HistoryStatistics < ActiveRecord::Base
		#self.primary_key = 'pin'
  def tiers
    sql = '''
WITH p_1000 AS (
	-- (1) Filter out the products with price > $1000
    SELECT p.*
	FROM products p
	WHERE fullprice::decimal(10,1) <= 1000
    ),
	p_minmax AS ( 
	-- (2) Find the min and max price of the current distribution
    SELECT MIN(fullprice::DECIMAL(10,1)) AS min_price,
    	   MAX(fullprice::DECIMAL(10,1)) AS max_price
    FROM p_1000
	)
-- (3) The data in the range min_price to max_price is divided into 10 + 1 buckets. Find the bucket to which the price of each product belongs to. And group them by buckets.
SELECT WIDTH_BUCKET(fullprice::DECIMAL(10,1), min_price, max_price, 10) AS bucket,
      MIN(fullprice::DECIMAL(10,1)) as min_price, MAX(fullprice::DECIMAL(10,1)) as max_price,
      COUNT(*) AS freq
FROM p_1000, p_minmax
GROUP BY bucket
ORDER BY bucket
'''

  end
end


