-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('renter', 'owner', 'both');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "GenderPref" AS ENUM ('male', 'female', 'any');

-- CreateEnum
CREATE TYPE "RentalGenderPolicy" AS ENUM ('male_only', 'female_only');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'room', 'bed');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('apartment', 'studio', 'duplex', 'roof', 'villa');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('draft', 'pending_approval', 'published', 'paused', 'rejected');

-- CreateEnum
CREATE TYPE "RentalMode" AS ENUM ('whole', 'by_room', 'by_bed');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('rent', 'sale');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('available', 'sold');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('available', 'occupied', 'reserved');

-- CreateEnum
CREATE TYPE "FurnishedPref" AS ENUM ('furnished', 'unfurnished', 'any');

-- CreateEnum
CREATE TYPE "Occupation" AS ENUM ('student', 'employee', 'remote', 'freelance', 'other');

-- CreateEnum
CREATE TYPE "NearbyType" AS ENUM ('metro', 'university', 'transit', 'mall', 'hospital', 'supermarket', 'other');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('pending', 'confirmed');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('pending', 'approved', 'declined', 'completed');

-- CreateEnum
CREATE TYPE "LeadIntent" AS ENUM ('viewing', 'booking');

-- CreateEnum
CREATE TYPE "LeadUnitKind" AS ENUM ('bed', 'room', 'whole');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'viewing_request');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('lead', 'message', 'review', 'verification', 'link');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'renter',
    "gender" "Gender",
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "trust" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "trust_breakdown" JSONB,
    "response_rate" INTEGER,
    "renter_reputation" DOUBLE PRECISION,
    "renter_reviews_count" INTEGER NOT NULL DEFAULT 0,
    "notification_prefs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renter_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intent" "ListingType" NOT NULL DEFAULT 'rent',
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "areas" TEXT[],
    "looking_for" "PropertyType"[],
    "move_in_by" TIMESTAMP(3),
    "must_have_amenities" TEXT[],
    "near_metro" BOOLEAN NOT NULL DEFAULT false,
    "metro_lines" TEXT[],
    "max_walk_minutes" INTEGER,
    "near_transit" BOOLEAN NOT NULL DEFAULT false,
    "furnished_pref" "FurnishedPref",
    "housemates_gender" "GenderPref",
    "occupation" "Occupation",
    "smoker" BOOLEAN,
    "bio" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'draft',
    "listing_type" "ListingType" NOT NULL DEFAULT 'rent',
    "rental_mode" "RentalMode",
    "unit_type" "UnitType",
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floor" INTEGER,
    "size_m2" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "price_from" INTEGER,
    "whole_price" INTEGER,
    "whole_status" "BedStatus",
    "nightly_price" INTEGER,
    "sale_price" INTEGER,
    "sale_status" "SaleStatus",
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "rent_to_gender" "RentalGenderPolicy",
    "images" TEXT[],
    "amenities" TEXT[],
    "costs" JSONB NOT NULL DEFAULT '[]',
    "trust" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "trust_breakdown" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "quality" JSONB,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "residents" INTEGER NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "moderated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "features" TEXT[],
    "size_m2" INTEGER,
    "price" INTEGER,
    "status" "BedStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'available',
    "price" INTEGER NOT NULL,
    "features" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupants" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "move_in_date" TIMESTAMP(3),
    "notes" TEXT,
    "user_id" TEXT,
    "link_status" "LinkStatus",
    "bed_id" TEXT,
    "room_id" TEXT,
    "whole_property_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nearby_places" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "type" "NearbyType" NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT,
    "minutes" INTEGER,

    CONSTRAINT "nearby_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_specs" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "custom_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "initials" TEXT NOT NULL DEFAULT '',
    "months_lived" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "scores" JSONB,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "owner_reply" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renter_reviews" (
    "id" TEXT NOT NULL,
    "tenancy_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "scores" JSONB NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renter_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_events" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "first_renter_message_at" TIMESTAMP(3) NOT NULL,
    "first_owner_reply_at" TIMESTAMP(3),

    CONSTRAINT "response_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "asker_id" TEXT,
    "asker_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "answer" TEXT,
    "answerer_id" TEXT,
    "answerer_name" TEXT,
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threads" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_for_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "renter_name" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'pending',
    "intent" "LeadIntent",
    "preferred_date" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_units" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "LeadUnitKind" NOT NULL,
    "room_id" TEXT,
    "room_name" TEXT,
    "bed_id" TEXT,
    "price" INTEGER,

    CONSTRAINT "lead_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancies" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "move_in_date" TIMESTAMP(3) NOT NULL,
    "move_out_date" TIMESTAMP(3),
    "months_lived" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "property_id" TEXT,
    "thread_id" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "id_doc_url" TEXT,
    "selfie_url" TEXT,
    "ownership_doc_url" TEXT,
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_verification_status_idx" ON "users"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "renter_profiles_user_id_key" ON "renter_profiles"("user_id");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "properties_listing_type_idx" ON "properties"("listing_type");

-- CreateIndex
CREATE INDEX "properties_area_idx" ON "properties"("area");

-- CreateIndex
CREATE INDEX "rooms_property_id_idx" ON "rooms"("property_id");

-- CreateIndex
CREATE INDEX "beds_room_id_idx" ON "beds"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupants_bed_id_key" ON "occupants"("bed_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupants_room_id_key" ON "occupants"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupants_whole_property_id_key" ON "occupants"("whole_property_id");

-- CreateIndex
CREATE INDEX "nearby_places_property_id_idx" ON "nearby_places"("property_id");

-- CreateIndex
CREATE INDEX "custom_specs_property_id_idx" ON "custom_specs"("property_id");

-- CreateIndex
CREATE INDEX "reviews_property_id_idx" ON "reviews"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_review_id_user_id_key" ON "review_helpful_votes"("review_id", "user_id");

-- CreateIndex
CREATE INDEX "renter_reviews_renter_id_idx" ON "renter_reviews"("renter_id");

-- CreateIndex
CREATE UNIQUE INDEX "renter_reviews_tenancy_id_owner_id_key" ON "renter_reviews"("tenancy_id", "owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "response_events_thread_id_key" ON "response_events"("thread_id");

-- CreateIndex
CREATE INDEX "response_events_owner_id_idx" ON "response_events"("owner_id");

-- CreateIndex
CREATE INDEX "questions_property_id_idx" ON "questions"("property_id");

-- CreateIndex
CREATE INDEX "threads_owner_id_idx" ON "threads"("owner_id");

-- CreateIndex
CREATE INDEX "threads_renter_id_idx" ON "threads"("renter_id");

-- CreateIndex
CREATE UNIQUE INDEX "threads_property_id_renter_id_key" ON "threads"("property_id", "renter_id");

-- CreateIndex
CREATE INDEX "messages_thread_id_idx" ON "messages"("thread_id");

-- CreateIndex
CREATE INDEX "leads_property_id_idx" ON "leads"("property_id");

-- CreateIndex
CREATE INDEX "leads_renter_id_idx" ON "leads"("renter_id");

-- CreateIndex
CREATE INDEX "tenancies_user_id_idx" ON "tenancies"("user_id");

-- CreateIndex
CREATE INDEX "tenancies_property_id_idx" ON "tenancies"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_listings_user_id_property_id_key" ON "saved_listings"("user_id", "property_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "verification_requests_user_id_idx" ON "verification_requests"("user_id");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- AddForeignKey
ALTER TABLE "renter_profiles" ADD CONSTRAINT "renter_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_whole_property_id_fkey" FOREIGN KEY ("whole_property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_specs" ADD CONSTRAINT "custom_specs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_reviews" ADD CONSTRAINT "renter_reviews_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_reviews" ADD CONSTRAINT "renter_reviews_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_reviews" ADD CONSTRAINT "renter_reviews_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_reviews" ADD CONSTRAINT "renter_reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_events" ADD CONSTRAINT "response_events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_events" ADD CONSTRAINT "response_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_asker_id_fkey" FOREIGN KEY ("asker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_answerer_id_fkey" FOREIGN KEY ("answerer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_units" ADD CONSTRAINT "lead_units_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
