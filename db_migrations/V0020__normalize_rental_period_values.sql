UPDATE requests SET rental_period = CASE rental_period
  WHEN '1-3 месяца' THEN '1-3'
  WHEN '3-6 месяцев' THEN '3-6'
  WHEN '6-12 месяцев' THEN '6-12'
  WHEN 'Более года' THEN '12+'
  ELSE rental_period
END;