START TRANSACTION;

-- Keep only real CampConnect accounts plus the requested personal account.
-- Remove test/example/smoke users and any rows that still depend on them.

DELETE FROM user_notifications
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM event_favorite
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM reservation
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM commande_repas
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM inscription_site
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM panier
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM reclamation
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM site_camping_avis
WHERE utilisateur_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM site_camping
WHERE owner_id IN (
    SELECT id
    FROM (
        SELECT id
        FROM utilisateur
        WHERE email NOT LIKE '%@campconnect.com'
          AND email <> 'ihebboughanmi17@gmail.com'
    ) AS removable_users
);

DELETE FROM utilisateur
WHERE email NOT LIKE '%@campconnect.com'
  AND email <> 'ihebboughanmi17@gmail.com';

-- Clean profiles that belonged only to removed test users.
DELETE FROM profil
WHERE id NOT IN (
    SELECT DISTINCT profil_id
    FROM utilisateur
    WHERE profil_id IS NOT NULL
);

COMMIT;
