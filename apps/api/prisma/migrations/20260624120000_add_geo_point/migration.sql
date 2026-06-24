-- PROD-4: PostGIS geo search.
-- Add a geography(Point) column derived from lat/lng, a GiST index for fast
-- radius queries, and a trigger so Prisma writes (which only set lat/lng) keep
-- the geography in sync automatically. Backfill from existing coordinates.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326);

-- Keep geog in sync with lat/lng on every insert/update.
CREATE OR REPLACE FUNCTION properties_sync_geog() RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  ELSE
    NEW.geog := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_sync_geog_trg ON "properties";
CREATE TRIGGER properties_sync_geog_trg
  BEFORE INSERT OR UPDATE OF lat, lng ON "properties"
  FOR EACH ROW EXECUTE FUNCTION properties_sync_geog();

-- Backfill existing rows.
UPDATE "properties"
SET "geog" = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Fast radius / nearest queries.
CREATE INDEX IF NOT EXISTS "properties_geog_idx" ON "properties" USING GIST ("geog");
