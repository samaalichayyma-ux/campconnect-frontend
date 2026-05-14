ALTER TABLE event
    ADD COLUMN IF NOT EXISTS reservation_approval_required TINYINT(1) NOT NULL DEFAULT 1 AFTER capacite_waitlist;
