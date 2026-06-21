-- PostGIS spatial indexes for geo queries
-- Run after prisma migrate dev

CREATE EXTENSION IF NOT EXISTS postgis;

-- GiST index for listings geo search
CREATE INDEX IF NOT EXISTS listings_location_gist_idx
ON listings USING GIST (
  geography(ST_MakePoint(location_lng, location_lat))
);

-- GiST index for groups geo search
CREATE INDEX IF NOT EXISTS groups_location_gist_idx
ON groups USING GIST (
  geography(ST_MakePoint(location_lng, location_lat))
);
