-- Add Event Images to Existing Events
-- Using correct event IDs from seed data

-- Add images to Event ID 1: Alpine Summit Challenge
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(1, 'alpine_summit_main.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Alpine Summit Peak View', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(1, 'alpine_chamonix.jpg', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'Chamonix Mountain Range', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(1, 'alpine_climbers.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Mountain Climbers Team', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 2: Hiking Through the Alps
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(2, 'hiking_alps_main.jpg', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', 'Alpine Hiking Trail', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(2, 'hiking_interlaken.jpg', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Interlaken Valley View', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(2, 'hiking_meadow.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Mountain Meadow', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 3: Forest Wilderness Camp
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(3, 'forest_camp_main.jpg', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'Forest Wilderness View', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(3, 'forest_camp_night.jpg', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 'Camping Under Stars', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(3, 'forest_cabin.jpg', 'https://images.unsplash.com/photo-1510301045126-da2dd65dd59f?w=800', 'Forest Cabin Retreat', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 4: Desert Trekking Adventure
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(4, 'desert_trek_main.jpg', 'https://images.unsplash.com/photo-1489575899121-29d326d7f83c?w=800', 'Sahara Desert Landscape', TRUE, 0, 'image/jpeg', 589824, NOW(), NOW()),
(4, 'desert_camel.jpg', 'https://images.unsplash.com/photo-1535274455618-51a541a5f3a2?w=800', 'Desert Camel Trek', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(4, 'desert_sunset.jpg', 'https://images.unsplash.com/photo-1437047387126-56d312d832ce?w=800', 'Desert Sunset Scene', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 5: Kayaking in Swiss Lakes
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(5, 'kayak_lake_main.jpg', 'https://images.unsplash.com/photo-1623193697122-cac9ab0b86f1?w=800', 'Lake Kayaking Adventure', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(5, 'kayak_zurich.jpg', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800', 'Swiss Lake Scenery', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(5, 'kayak_group.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Kayaking Team Activity', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 6: Surfing Summer Camp
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(6, 'surf_main.jpg', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Ocean Surfing Beach', TRUE, 0, 'image/jpeg', 557056, NOW(), NOW()),
(6, 'surf_wave.jpg', 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=800', 'Perfect Wave', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(6, 'surf_lesson.jpg', 'https://images.unsplash.com/photo-1577720643272-265f434e2429?w=800', 'Surfing Lesson Group', FALSE, 2, 'image/jpeg', 524288, NOW(), NOW());

-- Add images to Event ID 7: Diving Certification Course
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(7, 'dive_main.jpg', 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800', 'Underwater Diving', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(7, 'dive_coral.jpg', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Coral Reef Scene', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(7, 'dive_diver.jpg', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Certified Diver', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 8: Whitewater Rafting Extreme
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(8, 'raft_main.jpg', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'Whitewater Rafting', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(8, 'raft_cascade.jpg', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', 'Cascading Rapids', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(8, 'raft_team.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Rafting Adventure Team', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Add images to Event ID 9: Sailing & Navigation
INSERT INTO event_image (event_id, image_name, image_url, description, is_primary, display_order, mime_type, file_size, upload_date, last_modified)
VALUES
(9, 'sail_main.jpg', 'https://images.unsplash.com/photo-1569263867416-15ba6c1c298c?w=800', 'Sailing Adventure', TRUE, 0, 'image/jpeg', 524288, NOW(), NOW()),
(9, 'sail_mediterranean.jpg', 'https://images.unsplash.com/photo-1545652711-491a64a27be4?w=800', 'Mediterranean Sailing', FALSE, 1, 'image/jpeg', 491520, NOW(), NOW()),
(9, 'sail_crew.jpg', 'https://images.unsplash.com/photo-1551632440-a106a6e8fc91?w=800', 'Sailing Crew Members', FALSE, 2, 'image/jpeg', 458752, NOW(), NOW());

-- Verify results
SELECT '=== IMAGES LOADED ===' as status;
SELECT COUNT(*) as total_images FROM event_image;
SELECT e.id, e.titre, COUNT(ei.id) as image_count FROM event e LEFT JOIN event_image ei ON e.id = ei.event_id WHERE e.id <= 9 GROUP BY e.id ORDER BY e.id;
