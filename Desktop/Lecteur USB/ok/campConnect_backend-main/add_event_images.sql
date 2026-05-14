-- ===========================
-- Add Event Image Support
-- ===========================

-- Create event_image table
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

-- Insert sample events if they don't exist
INSERT IGNORE INTO event (
    titre, 
    description, 
    categorie, 
    statut, 
    date_debut, 
    date_fin, 
    lieu, 
    capacite_max, 
    capacite_waitlist, 
    prix, 
    duree_minutes, 
    banner_image, 
    organisateur_id, 
    date_creation, 
    date_modification
) VALUES 
(
    'Summer Camping Adventure',
    'Experience the beautiful outdoors with guided camping tours in the mountains. Perfect for nature lovers and adventure seekers.',
    'RANDONNEE',
    'SCHEDULED',
    '2026-06-15 08:00:00',
    '2026-06-20 18:00:00',
    'Mont Blanc, Alps',
    50,
    10,
    150.00,
    7200,
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d',
    1,
    NOW(),
    NOW()
),
(
    'Beach Paradise Weekend',
    'Join us for a relaxing weekend at the beautiful Mediterranean beaches with water sports and entertainment.',
    'LOISIR',
    'SCHEDULED',
    '2026-07-10 09:00:00',
    '2026-07-12 17:00:00',
    'Hammamet Beach, Tunisia',
    100,
    20,
    120.00,
    4800,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    2,
    NOW(),
    NOW()
),
(
    'Desert Safari Expedition',
    'Explore the mystical Sahara desert with camping under the stars, camel rides, and cultural experiences.',
    'AVENTURE',
    'SCHEDULED',
    '2026-08-01 07:00:00',
    '2026-08-05 19:00:00',
    'Sahara, Tozeur',
    40,
    15,
    200.00,
    8640,
    'https://images.unsplash.com/photo-1489575899121-29d326d7f83c',
    1,
    NOW(),
    NOW()
),
(
    'Mountain Hiking Challenge',
    'Challenge yourself with this intense mountain hiking expedition. Professional guides included.',
    'RANDONNEE',
    'SCHEDULED',
    '2026-05-20 06:00:00',
    '2026-05-22 18:00:00',
    'Cascade de Tafiga, Ain Draham',
    30,
    10,
    100.00,
    4320,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    2,
    NOW(),
    NOW()
),
(
    'Forest Meditation Retreat',
    'Find peace and tranquility in nature with yoga, meditation, and forest therapy sessions.',
    'BIEN_ETRE',
    'SCHEDULED',
    '2026-09-05 10:00:00',
    '2026-09-08 16:00:00',
    'Green Forest, Zaghouan',
    25,
    5,
    180.00,
    4320,
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    3,
    NOW(),
    NOW()
);

-- Add images to events
-- Summer Camping Adventure (Event ID 1)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date)
VALUES
(1, 'camping_main.jpg', 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800', 'Main camping site view', TRUE, 0, 'image/jpeg', 524288, NOW()),
(1, 'camping_night.jpg', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 'Nighttime camping with stars', FALSE, 1, 'image/jpeg', 458752, NOW()),
(1, 'camping_fire.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Campfire gathering', FALSE, 2, 'image/jpeg', 491520, NOW());

-- Beach Paradise Weekend (Event ID 2)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date)
VALUES
(2, 'beach_main.jpg', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Beautiful beach sunset', TRUE, 0, 'image/jpeg', 557056, NOW()),
(2, 'beach_water.jpg', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800', 'Crystal clear water', FALSE, 1, 'image/jpeg', 491520, NOW()),
(2, 'beach_palm.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Tropical beach paradise', FALSE, 2, 'image/jpeg', 524288, NOW());

-- Desert Safari Expedition (Event ID 3)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date)
VALUES
(3, 'desert_main.jpg', 'https://images.unsplash.com/photo-1489575899121-29d326d7f83c?w=800', 'Vast desert landscape', TRUE, 0, 'image/jpeg', 589824, NOW()),
(3, 'desert_camp.jpg', 'https://images.unsplash.com/photo-1437047387126-56d312d832ce?w=800', 'Bedouin desert camp', FALSE, 1, 'image/jpeg', 458752, NOW()),
(3, 'desert_camel.jpg', 'https://images.unsplash.com/photo-1535274455618-51a541a5f3a2?w=800', 'Desert camel ride', FALSE, 2, 'image/jpeg', 491520, NOW());

-- Mountain Hiking Challenge (Event ID 4)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date)
VALUES
(4, 'mountain_main.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Mountain peak view', TRUE, 0, 'image/jpeg', 524288, NOW()),
(4, 'mountain_trail.jpg', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'Hiking trail landscape', FALSE, 1, 'image/jpeg', 491520, NOW()),
(4, 'mountain_group.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Hiking group adventure', FALSE, 2, 'image/jpeg', 458752, NOW());

-- Forest Meditation Retreat (Event ID 5)
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date)
VALUES
(5, 'forest_main.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Peaceful forest meditation', TRUE, 0, 'image/jpeg', 491520, NOW()),
(5, 'forest_cabin.jpg', 'https://images.unsplash.com/photo-1510301045126-da2dd65dd59f?w=800', 'Forest retreat cabin', FALSE, 1, 'image/jpeg', 524288, NOW()),
(5, 'forest_stream.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Forest stream and nature', FALSE, 2, 'image/jpeg', 458752, NOW());

-- Verify the data
SELECT COUNT(*) as total_events FROM event WHERE titre IN ('Summer Camping Adventure', 'Beach Paradise Weekend', 'Desert Safari Expedition', 'Mountain Hiking Challenge', 'Forest Meditation Retreat');
SELECT COUNT(*) as total_images FROM event_image;
SELECT e.titre, COUNT(ei.id) as image_count FROM event e LEFT JOIN event_image ei ON e.id = ei.event_id WHERE e.titre IN ('Summer Camping Adventure', 'Beach Paradise Weekend', 'Desert Safari Expedition', 'Mountain Hiking Challenge', 'Forest Meditation Retreat') GROUP BY e.id, e.titre;
