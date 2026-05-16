CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION update_supplier_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_supplier_location ON "Supplier";

CREATE TRIGGER trigger_update_supplier_location
BEFORE INSERT OR UPDATE ON "Supplier"
FOR EACH ROW
EXECUTE FUNCTION update_supplier_location();

UPDATE "Supplier" SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
