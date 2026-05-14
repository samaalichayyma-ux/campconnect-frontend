-- ===========================
-- Seed Test Data for CampConnect
-- ===========================

-- Insert Test Users (Guides, Managers, Clients)
INSERT INTO utilisateur (nom, email, mot_de_passe, telephone, role, date_creation) VALUES
('Alpine Guide - Pierre', 'pierre.guide@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41791234567', 'GUIDE', NOW()),
('Water Sports Master - Sophie', 'sophie.water@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41792345678', 'GUIDE', NOW()),
('Rock Climbing Expert - Marc', 'marc.climbing@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41793456789', 'GUIDE', NOW()),
('Wellness Coach - Anna', 'anna.wellness@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41794567890', 'GUIDE', NOW()),
('Cultural Expert - Luis', 'luis.culture@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41795678901', 'GUIDE', NOW()),
('Sports Director - Thomas', 'thomas.sports@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41796789012', 'GERANT_RESTAU', NOW()),
('Event Manager - Claire', 'claire.manager@campconnect.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41797890123', 'GERANT_RESTAU', NOW()),
('Client User 1', 'client1@example.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41798901234', 'CLIENT', NOW()),
('Client User 2', 'client2@example.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41799012345', 'CLIENT', NOW()),
('Client User 3', 'client3@example.com', '$2a$10$GRLdNijSQMUvqfH3Br3ZZuEQ/O2J9JvI2ZW5K1t3oPwVZ2r4ViPMK', '+41790123456', 'CLIENT', NOW());

-- ===========================
-- Insert 30+ Test Events
-- ===========================

INSERT INTO event (titre, description, categorie, statut, date_debut, date_fin, lieu, capacite_max, capacite_waitlist, prix, duree_minutes, organisateur_id, date_creation, date_modification) VALUES

-- ADVENTURE Events (Organizer: Pierre - ID 2)
('Alpine Summit Challenge', 'Reach the peak of Mont Blanc with experienced guides. Learn mountaineering techniques and enjoy breathtaking views.', 'ADVENTURE', 'SCHEDULED', '2026-04-10 08:00:00', '2026-04-12 18:00:00', 'Chamonix, France', 20, 5, 450.00, 2880, 2, NOW(), NOW()),
('Hiking Through the Alps', 'Multi-day hiking expedition with scenic mountain trails. All fitness levels welcome.', 'ADVENTURE', 'SCHEDULED', '2026-05-15 09:00:00', '2026-05-18 17:00:00', 'Interlaken, Switzerland', 30, 8, 350.00, 2880, 2, NOW(), NOW()),
('Forest Wilderness Camp', 'Immerse yourself in nature. Camping, foraging, and wildlife observation.', 'CAMPING_ACTIVITY', 'SCHEDULED', '2026-06-01 10:00:00', '2026-06-03 16:00:00', 'Black Forest, Germany', 25, 6, 280.00, 1920, 2, NOW(), NOW()),
('Desert Trekking Adventure', 'Experience the Sahara with expert guides. Camel rides and stargazing included.', 'ADVENTURE', 'SCHEDULED', '2026-07-10 06:00:00', '2026-07-14 18:00:00', 'Merzouga, Morocco', 15, 4, 550.00, 4320, 2, NOW(), NOW()),
('Kayaking in Swiss Lakes', 'Paddle through crystal clear alpine lakes. Beginner-friendly instruction provided.', 'GUIDED_TOUR', 'SCHEDULED', '2026-04-20 09:00:00', '2026-04-20 17:00:00', 'Lake Zurich, Switzerland', 25, 5, 120.00, 480, 3, NOW(), NOW()),
('Surfing Summer Camp', 'Learn surfing basics at Atlantic coast beaches. Equipment and coaching included.', 'RESTORATION', 'SCHEDULED', '2026-06-15 08:00:00', '2026-06-22 19:00:00', 'Biarritz, France', 20, 5, 380.00, 2880, 3, NOW(), NOW()),
('Diving Certification Course', 'Get PADI Open Water Certification in tropical waters. All gear provided.', 'ADVENTURE', 'SCHEDULED', '2026-07-01 09:00:00', '2026-07-05 17:00:00', 'Cyprus Mediterranean', 12, 3, 420.00, 2400, 3, NOW(), NOW()),
('Whitewater Rafting Extreme', 'High-adrenaline rafting on grade 4-5 rapids. Safety briefing and equipment included.', 'ADVENTURE', 'SCHEDULED', '2026-05-20 08:00:00', '2026-05-20 18:00:00', 'Ötztal, Austria', 18, 4, 180.00, 600, 3, NOW(), NOW()),
('Sailing & Navigation', 'Learn sailing fundamentals. Day trips on Mediterranean Sea included.', 'GUIDED_TOUR', 'SCHEDULED', '2026-06-10 10:00:00', '2026-06-12 18:00:00', 'Mallorca, Spain', 16, 4, 320.00, 1440, 3, NOW(), NOW()),

-- SOCIAL_EVENT Events (Organizer: Thomas - ID 6)
('Mountain Biking Race', 'Competitive and recreational mountain biking event. Multiple trail difficulties.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-04-25 08:00:00', '2026-04-25 17:00:00', 'Whistler, Canada', 50, 10, 95.00, 540, 6, NOW(), NOW()),
('Tennis Tournament', 'Amateur and professional tennis competition. Singles and doubles categories.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-05-10 09:00:00', '2026-05-12 18:00:00', 'Roland Garros, Paris', 40, 8, 150.00, 1440, 6, NOW(), NOW()),
('Football Tournament', '5v5 football championship with prizes. Open registration until April 1st.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-05-01 10:00:00', '2026-05-03 20:00:00', 'Amsterdam, Netherlands', 80, 15, 80.00, 1200, 6, NOW(), NOW()),
('Yoga & Fitness Retreat', 'Weekend yoga, meditation, and fitness classes. Includes meals and accommodation.', 'WELLNESS', 'SCHEDULED', '2026-04-15 08:00:00', '2026-04-17 17:00:00', 'Barcelona, Spain', 35, 7, 280.00, 1440, 6, NOW(), NOW()),

-- ADVENTURE/WORKSHOP Events (Organizer: Marc - ID 4)
('Indoor Rock Climbing Basics', 'Learn climbing fundamentals in safe indoor environment. Ideal for beginners.', 'WORKSHOP', 'SCHEDULED', '2026-04-05 10:00:00', '2026-04-05 18:00:00', 'Zurich Climbing Hall', 20, 5, 65.00, 480, 4, NOW(), NOW()),
('Outdoor Rock Climbing - Grade 5', 'Advanced outdoor climbing on natural rock faces. Equipment and guides provided.', 'ADVENTURE', 'SCHEDULED', '2026-04-28 08:00:00', '2026-04-29 17:00:00', 'Kalymnos, Greece', 12, 3, 320.00, 1440, 4, NOW(), NOW()),
('Via Ferrata Adventure', 'Protected mountain climbing routes with cables and footholds. No prior experience needed.', 'ADVENTURE', 'SCHEDULED', '2026-05-25 09:00:00', '2026-05-25 18:00:00', 'Dolomites, Italy', 25, 6, 110.00, 540, 4, NOW(), NOW()),
('Ice Climbing Expedition', 'Learn ice climbing on frozen waterfalls. Winter gear and training included.', 'ADVENTURE', 'SCHEDULED', '2026-02-15 08:00:00', '2026-02-17 17:00:00', 'Chamonix, France', 10, 2, 450.00, 1440, 4, NOW(), NOW()),

-- WELLNESS Events (Organizer: Anna - ID 5)
('Meditation & Mindfulness Retreat', '7-day silent retreat with daily meditation practices. Vegetarian meals provided.', 'WELLNESS', 'SCHEDULED', '2026-04-10 07:00:00', '2026-04-17 19:00:00', 'Bali, Indonesia', 30, 6, 890.00, 7200, 5, NOW(), NOW()),
('Spa & Relaxation Weekend', 'Luxury spa treatments, massages, and thermal baths. All-inclusive package.', 'WELLNESS', 'SCHEDULED', '2026-05-02 14:00:00', '2026-05-04 13:00:00', 'Baden-Baden, Germany', 25, 5, 550.00, 1440, 5, NOW(), NOW()),
('Fitness Bootcamp', 'Intensive 5-day fitness training with personal coaching. Accommodation included.', 'WELLNESS', 'SCHEDULED', '2026-05-20 06:00:00', '2026-05-25 20:00:00', 'Canary Islands, Spain', 40, 8, 420.00, 2400, 5, NOW(), NOW()),
('Holistic Health Workshop', 'Learn about nutrition, holistic healing, and alternative medicine practices.', 'WELLNESS', 'SCHEDULED', '2026-06-08 09:00:00', '2026-06-10 17:00:00', 'Costa Rica', 35, 7, 380.00, 1440, 5, NOW(), NOW()),

-- GUIDED_TOUR Events (Organizer: Luis - ID 5)
('Art History in Rome', 'Guided tours of Vatican Museums, Colosseum, and Renaissance art. Expert commentary.', 'GUIDED_TOUR', 'SCHEDULED', '2026-04-12 09:00:00', '2026-04-16 18:00:00', 'Rome, Italy', 25, 5, 720.00, 2880, 5, NOW(), NOW()),
('Wine Tasting Tour - Bordeaux', 'Visit legendary vineyards. Learn wine making and tasting techniques from experts.', 'GUIDED_TOUR', 'SCHEDULED', '2026-05-18 10:00:00', '2026-05-21 19:00:00', 'Bordeaux, France', 20, 4, 650.00, 2400, 5, NOW(), NOW()),
('Greek Island Cultural Cruise', 'Island hopping with archaeological sites. Includes meals and accommodation.', 'GUIDED_TOUR', 'SCHEDULED', '2026-06-20 10:00:00', '2026-06-27 18:00:00', 'Greek Islands', 40, 8, 1200.00, 3600, 5, NOW(), NOW()),
('Music Festival Weekend', 'International artists, live performances, camping area, food vendors on-site.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-07-15 18:00:00', '2026-07-17 23:00:00', 'Montreux, Switzerland', 500, 100, 180.00, 1440, 5, NOW(), NOW()),

-- EDUCATIONAL Events (Organizer: Claire - ID 7)
('Photography Master Class', 'Professional photography techniques. Hands-on training with DSLR cameras.', 'WORKSHOP', 'SCHEDULED', '2026-04-08 10:00:00', '2026-04-10 17:00:00', 'Berlin, Germany', 15, 3, 280.00, 1200, 7, NOW(), NOW()),
('Digital Marketing Boot Camp', 'Learn SEO, social media, and content marketing. Certificate upon completion.', 'EDUCATIONAL', 'SCHEDULED', '2026-05-05 09:00:00', '2026-05-09 17:00:00', 'Amsterdam, Netherlands', 30, 6, 420.00, 2400, 7, NOW(), NOW()),
('Culinary Arts Workshop', 'Learn cooking from Michelin-starred chefs. Prepare and taste 5-course menus.', 'WORKSHOP', 'SCHEDULED', '2026-06-02 09:00:00', '2026-06-05 20:00:00', 'Lyon, France', 20, 4, 580.00, 1800, 7, NOW(), NOW()),
('Language Immersion - Spanish', 'Intensive Spanish language course in Barcelona. Classes and cultural activities.', 'EDUCATIONAL', 'SCHEDULED', '2026-06-10 09:00:00', '2026-06-24 17:00:00', 'Barcelona, Spain', 25, 5, 780.00, 3360, 7, NOW(), NOW()),

-- RESTORATION Events (Organizer: Thomas - ID 6)
('Electronic Music Festival', 'World-renowned DJs, laser shows, VIP lounge. 3-day experience.', 'RESTORATION', 'SCHEDULED', '2026-07-22 22:00:00', '2026-07-25 06:00:00', 'Ibiza, Spain', 1000, 200, 240.00, 2160, 6, NOW(), NOW()),
('Club Crawl Night', 'VIP access to top nightclubs with skip-the-line entry. Drinks included.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-05-04 21:00:00', '2026-05-05 04:00:00', 'Prague, Czech Republic', 50, 10, 85.00, 420, 6, NOW(), NOW()),
('Gourmet Dinner Experience', 'Multi-course meal at Michelin-starred restaurant with wine pairing.', 'RESTORATION', 'SCHEDULED', '2026-05-30 19:00:00', '2026-05-31 02:00:00', 'Monte Carlo, Monaco', 20, 3, 520.00, 420, 6, NOW(), NOW()),
('Beach Volleyball Tournament', '2v2 beach volleyball with coaching and team activities throughout the day.', 'SOCIAL_EVENT', 'SCHEDULED', '2026-06-25 10:00:00', '2026-06-25 18:00:00', 'Laguna Beach, California', 60, 12, 75.00, 480, 6, NOW(), NOW());

-- Verify insertion
SELECT COUNT(*) as total_events FROM event;
