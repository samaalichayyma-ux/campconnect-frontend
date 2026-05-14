-- ===========================
-- Migration: Add Image Support to Events
-- ===========================

-- Add image columns to event table
ALTER TABLE event ADD COLUMN banner_image VARCHAR(500) NULL;
ALTER TABLE event ADD COLUMN thumbnail_image VARCHAR(500) NULL;
ALTER TABLE event ADD COLUMN gallery_images LONGTEXT NULL;

-- Create index for searching by category with images
CREATE INDEX idx_event_category ON event(categorie);
CREATE INDEX idx_event_status ON event(statut);
CREATE INDEX idx_event_organisateur ON event(organisateur_id);

-- Verify the new columns
DESCRIBE event;
