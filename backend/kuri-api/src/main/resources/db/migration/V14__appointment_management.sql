ALTER TABLE appointment
    ADD COLUMN estimated_price numeric(10, 2)
        CHECK (estimated_price IS NULL OR estimated_price >= 0);

-- Before estimated price existed, admins sometimes used final_price as a
-- pre-visit estimate. Preserve that information under the new meaning while
-- keeping final_price reserved for completed visits.
UPDATE appointment
SET estimated_price = final_price,
    final_price = NULL
WHERE status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED')
  AND final_price IS NOT NULL;
