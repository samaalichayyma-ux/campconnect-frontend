-- ===========================
-- Add Event Images to Existing Events
-- ===========================

-- Create event_image table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_data LONGTEXT NULL,
    description TEXT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    mime_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_display_order (display_order)
);

-- Add images to Event ID 55: Alpine Summit Challenge (ADVENTURE, Chamonix)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(55, 'alpine_summit_main.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Alpine Summit Peak View', TRUE, 0, 'image/jpeg', 524288),
(55, 'alpine_chamonix.jpg', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'Chamonix Mountain Range', FALSE, 1, 'image/jpeg', 491520),
(55, 'alpine_climbers.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Mountain Climbers Team', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 56: Hiking Through the Alps (ADVENTURE, Interlaken)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(56, 'hiking_alps_main.jpg', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'Alpine Hiking Trail', TRUE, 0, 'image/jpeg', 524288),
(56, 'hiking_interlaken.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Interlaken Valley View', FALSE, 1, 'image/jpeg', 491520),
(56, 'hiking_meadow.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Mountain Meadow', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 57: Forest Wilderness Camp (CAMPING_ACTIVITY, Black Forest)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(57, 'forest_camp_main.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Forest Wilderness View', TRUE, 0, 'image/jpeg', 524288),
(57, 'forest_camp_night.jpg', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 'Camping Under Stars', FALSE, 1, 'image/jpeg', 491520),
(57, 'forest_cabin.jpg', 'https://images.unsplash.com/photo-1510301045126-da2dd65dd59f?w=800', 'Forest Cabin Retreat', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 58: Desert Trekking Adventure (ADVENTURE, Merzouga)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(58, 'desert_trek_main.jpg', 'https://images.unsplash.com/photo-1489575899121-29d326d7f83c?w=800', 'Sahara Desert Landscape', TRUE, 0, 'image/jpeg', 589824),
(58, 'desert_camel.jpg', 'https://images.unsplash.com/photo-1535274455618-51a541a5f3a2?w=800', 'Desert Camel Trek', FALSE, 1, 'image/jpeg', 491520),
(58, 'desert_sunset.jpg', 'https://images.unsplash.com/photo-1437047387126-56d312d832ce?w=800', 'Desert Sunset Scene', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 59: Kayaking in Swiss Lakes (GUIDED_TOUR, Lake Zurich)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(59, 'kayak_lake_main.jpg', 'https://images.unsplash.com/photo-1623193697122-cac9ab0b86f1?w=800', 'Lake Kayaking Adventure', TRUE, 0, 'image/jpeg', 524288),
(59, 'kayak_zurich.jpg', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800', 'Swiss Lake Scenery', FALSE, 1, 'image/jpeg', 491520),
(59, 'kayak_group.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Kayaking Team Activity', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 60: Surfing Summer Camp (RESTORATION, Biarritz)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(60, 'surf_main.jpg', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Ocean Surfing Beach', TRUE, 0, 'image/jpeg', 557056),
(60, 'surf_wave.jpg', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800', 'Perfect Wave', FALSE, 1, 'image/jpeg', 491520),
(60, 'surf_lesson.jpg', 'https://images.unsplash.com/photo-1577720643272-265f434e2429?w=800', 'Surfing Lesson Group', FALSE, 2, 'image/jpeg', 524288);

-- Add images to Event ID 61: Diving Certification Course (ADVENTURE, Cyprus Mediterranean)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(61, 'dive_main.jpg', 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800', 'Underwater Diving', TRUE, 0, 'image/jpeg', 524288),
(61, 'dive_coral.jpg', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Coral Reef Scene', FALSE, 1, 'image/jpeg', 491520),
(61, 'dive_diver.jpg', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Certified Diver', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 62: Whitewater Rafting Extreme (ADVENTURE, Otztal)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(62, 'raft_main.jpg', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'Whitewater Rafting', TRUE, 0, 'image/jpeg', 524288),
(62, 'raft_cascade.jpg', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', 'Cascading Rapids', FALSE, 1, 'image/jpeg', 491520),
(62, 'raft_team.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Rafting Adventure Team', FALSE, 2, 'image/jpeg', 458752);

-- Add images to Event ID 63: Sailing & Navigation (GUIDED_TOUR, Mallorca)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size)
VALUES
(63, 'sail_main.jpg', 'https://images.unsplash.com/photo-1569263867416-15ba6c1c298c?w=800', 'Sailing Adventure', TRUE, 0, 'image/jpeg', 524288),
(63, 'sail_mediterranean.jpg', 'https://images.unsplash.com/photo-1545652711-491a64a27be4?w=800', 'Mediterranean Sailing', FALSE, 1, 'image/jpeg', 491520),
(63, 'sail_crew.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Sailing Crew Members', FALSE, 2, 'image/jpeg', 458752);

-- Verify the data
SELECT '=== EVENT IMAGE SUMMARY ===' as status;
SELECT COUNT(*) as total_images FROM event_image;

SELECT '=== IMAGES BY EVENT ===' as status;
SELECT 
    e.id,
    e.titre,
    COUNT(ei.id) as image_count,
    SUM(CASE WHEN ei.is_primary = TRUE THEN 1 ELSE 0 END) as primary_images
FROM event e
LEFT JOIN event_image ei ON e.id = ei.event_id
WHERE e.id IN (54, 55, 56, 57, 58, 59, 60, 61, 62, 63)
GROUP BY e.id, e.titre
ORDER BY e.id;

SELECT '=== SAMPLE IMAGES ===' as status;
SELECT 
    ei.id, 
    e.titre, 
    ei.image_name, 
    ei.is_primary, 
    ei.display_order
FROM event_image ei
JOIN event e ON ei.event_id = e.id
ORDER BY e.id, ei.display_order
LIMIT 15;
