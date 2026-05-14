SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM site_camping_avis
WHERE commentaire LIKE 'SEED:%'
   OR site_camping_id_site IN (
    SELECT id_site
    FROM site_camping
    WHERE nom LIKE 'SEED - %'
);

DELETE FROM inscription_site
WHERE site_id IN (
    SELECT id_site
    FROM site_camping
    WHERE nom LIKE 'SEED - %'
);

DELETE FROM site_camping
WHERE nom LIKE 'SEED - %';

SET FOREIGN_KEY_CHECKS = 1;