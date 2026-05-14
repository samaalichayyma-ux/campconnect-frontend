INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Amazing mountain atmosphere and very calm place.',
    '2026-04-12',
    5,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'mohamed@campconnect.com'
WHERE s.nom = 'SEED - Zaghouan Mountain Camp';

INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Nice view and clean environment.',
    '2026-04-13',
    4,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'nada123@campconnect.com'
WHERE s.nom = 'SEED - Zaghouan Mountain Camp';

INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Good for families, very peaceful lake area.',
    '2026-04-18',
    5,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'molkclient@campconnect.com'
WHERE s.nom = 'SEED - Bni Mtir Lake Camp';

INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Nice camp but access road was a bit difficult.',
    '2026-04-19',
    3,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'molkmomo84@gmail.com'
WHERE s.nom = 'SEED - Tabarka Eco Camp';

INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Excellent cultural experience and great hosts.',
    '2026-04-28',
    5,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'molkmomo84@gmail.com'
WHERE s.nom = 'SEED - Matmata Troglodyte Camp';

INSERT INTO site_camping_avis (
    commentaire,
    date_creation,
    note,
    site_camping_id_site,
    utilisateur_id
)
SELECT
    'SEED: Very original desert concept, would go again.',
    '2026-04-29',
    4,
    s.id_site,
    u.id
FROM site_camping s
         JOIN utilisateur u ON u.email = 'mohamed@campconnect.com'
WHERE s.nom = 'SEED - Matmata Troglodyte Camp';