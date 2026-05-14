-- 02-site_camping-seed.sql
-- Safe team seed:
-- - does NOT touch utilisateur
-- - resolves owner_id by email
-- - uses SEED-prefixed names for easy cleanup
-- - uses real Cloudinary image_public_id + image_url

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    18,
    'Mountain camping experience near Zaghouan with panoramic views and hiking trails.',
    NULL,
    'Zaghouan, Tunisia',
    'SEED - Zaghouan Mountain Camp',
    105,
    'AVAILABLE',
    'campconnect/site-camping/x1t6ada5x1f5dfjqpfpv',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1775649044/campconnect/site-camping/x1t6ada5x1f5dfjqpfpv.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'molk.saouabi@gmail.com';

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    20,
    'Peaceful lakeside campsite surrounded by pine trees and cool mountain air',
    NULL,
    'Bni Mtir, Jendouba, Tunisia',
    'SEED - Bni Mtir Lake Camp',
    115,
    'AVAILABLE',
    'campconnect/site-camping/xizwas96hkmksgp2kbc7',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1775650533/campconnect/site-camping/xizwas96hkmksgp2kbc7.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'molk.saouabi@gmail.com';

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    16,
    'Eco-friendly campsite surrounded by forests and mountains near Tabarka',
    NULL,
    'Tabarka, Jendouba, Tunisia',
    'SEED - Tabarka Eco Camp',
    120,
    'AVAILABLE',
    'campconnect/site-camping/ut9ojpfu8uppqcjojfd1',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1774458969/campconnect/site-camping/ut9ojpfu8uppqcjojfd1.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'guide333@campconnect.com';

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    16,
    'Remote coastal campsite with wild beaches, cliffs, and sunset viewpoints',
    NULL,
    'Cap Serrat, Bizerte, Tunisia',
    'SEED - Cap Serrat Wild Camp',
    125.98,
    'FULL',
    'campconnect/site-camping/mliqewymtpbmn79sjfe1',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1775650775/campconnect/site-camping/mliqewymtpbmn79sjfe1.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'molk.saouabi@gmail.com';

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    24,
    'Unique desert-style camp near Matmata with cultural immersion and desert excursions',
    NULL,
    'Matmata, Gabes, Tunisia',
    'SEED - Matmata Troglodyte Camp',
    125,
    'AVAILABLE',
    'campconnect/site-camping/gfgufugp1ckksxczyyhm',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1775651188/campconnect/site-camping/gfgufugp1ckksxczyyhm.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'molk.saouabi@gmail.com';

INSERT INTO site_camping (
    capacite,
    description,
    image,
    localisation,
    nom,
    prix_par_nuit,
    statut_dispo,
    image_public_id,
    image_url,
    owner_id
)
SELECT
    29,
    'Traditional desert camp in Douz offering camel rides and Sahara excursions.',
    NULL,
    'Douz, Kebili, Tunisia',
    'SEED - Camp Sahara Douz',
    180,
    'CLOSED',
    'campconnect/site-camping/dtdyovmcebfpwp1iluc3',
    'https://res.cloudinary.com/dczqefpdb/image/upload/v1774458319/campconnect/site-camping/dtdyovmcebfpwp1iluc3.jpg',
    u.id
FROM utilisateur u
WHERE u.email = 'guide333@campconnect.com';