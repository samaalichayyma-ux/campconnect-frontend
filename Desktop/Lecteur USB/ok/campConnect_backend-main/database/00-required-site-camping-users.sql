-- REQUIRED USERS FOR CAMPING SEED
-- These emails must already exist in table `utilisateur`
-- before running the seed files below.

-- Guides / owners
-- guide333@campconnect.com
-- molk.saouabi@gmail.com
-- molk.saouabi@esprit.tn

-- Clients
-- mohamed@campconnect.com
-- nada123@campconnect.com
-- molkclient@campconnect.com
-- molkmomo84@gmail.com

-- Optional quick check:
SELECT id, email, role
FROM utilisateur
WHERE email IN (
                'guide333@campconnect.com',
                'molk.saouabi@gmail.com',
                'mohamed@campconnect.com',
                'nada123@campconnect.com',
                'molkclient@campconnect.com',
                'molkmomo84@gmail.com',
               'molk.saouabi@esprit.tn'
    );