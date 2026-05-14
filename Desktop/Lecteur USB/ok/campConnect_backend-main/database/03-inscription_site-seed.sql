INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-04-10',
    '2026-04-12',
    2,
    'CONFIRMED',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'mohamed@campconnect.com'
WHERE s.nom = 'SEED - Zaghouan Mountain Camp';

INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-04-15',
    '2026-04-18',
    3,
    'PENDING',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'nada123@campconnect.com'
WHERE s.nom = 'SEED - Bni Mtir Lake Camp';

INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-04-20',
    '2026-04-22',
    1,
    'CANCELLED',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'molkclient@campconnect.com'
WHERE s.nom = 'SEED - Tabarka Eco Camp';

INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-04-24',
    '2026-04-27',
    4,
    'CONFIRMED',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'molkmomo84@gmail.com'
WHERE s.nom = 'SEED - Matmata Troglodyte Camp';

INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-05-02',
    '2026-05-04',
    2,
    'PENDING',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'mohamed@campconnect.com'
WHERE s.nom = 'SEED - Cap Serrat Wild Camp';

INSERT INTO inscription_site (
    date_debut,
    date_fin,
    number_of_guests,
    statut,
    site_id,
    utilisateur_id
)
SELECT
    '2026-05-08',
    '2026-05-10',
    2,
    'PENDING',
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'nada123@campconnect.com'
WHERE s.nom = 'SEED - Zaghouan Mountain Camp';