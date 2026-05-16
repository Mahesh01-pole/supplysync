ALTER TABLE "DeliveryTracking" ADD COLUMN IF NOT EXISTS "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "DeliveryTracking" ADD UNIQUE ("order_id");
