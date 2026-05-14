-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Mar 01, 2026 at 09:06 PM
-- Server version: 8.3.0
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `campconnect`
--

-- --------------------------------------------------------

--
-- Table structure for table `inscription_site`
--

CREATE TABLE `inscription_site` (
  `id_inscription` bigint NOT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` enum('ANNULEE','EN_ATTENTE','REFUSEE','VALIDEE') DEFAULT NULL,
  `site_camping_id_site` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `inscription_site`
--

INSERT INTO `inscription_site` (`id_inscription`, `date_debut`, `date_fin`, `statut`, `site_camping_id_site`) VALUES
(1, '2026-03-10', '2026-03-15', 'EN_ATTENTE', 1),
(2, '2026-03-20', '2026-03-22', 'VALIDEE', 1),
(3, '2026-04-01', '2026-04-05', 'VALIDEE', 2),
(4, '2026-04-10', '2026-04-12', 'EN_ATTENTE', 2),
(5, '2026-04-15', '2026-04-18', 'VALIDEE', 3),
(6, '2026-04-20', '2026-04-23', 'REFUSEE', 3),
(7, '2026-05-01', '2026-05-04', 'VALIDEE', 4),
(8, '2026-05-10', '2026-05-12', 'ANNULEE', 4),
(9, '2026-03-05', '2026-03-08', 'VALIDEE', 5),
(10, '2026-03-12', '2026-03-14', 'EN_ATTENTE', 5),
(11, '2026-06-01', '2026-06-03', 'VALIDEE', 6),
(12, '2026-06-05', '2026-06-07', 'VALIDEE', 6),
(13, '2026-07-10', '2026-07-12', 'EN_ATTENTE', 7),
(14, '2026-07-15', '2026-07-18', 'VALIDEE', 7),
(15, '2026-08-01', '2026-08-03', 'REFUSEE', 8),
(16, '2026-08-06', '2026-08-08', 'VALIDEE', 8),
(17, '2026-09-01', '2026-09-05', 'VALIDEE', 9);

-- --------------------------------------------------------

--
-- Table structure for table `site_camping`
--

CREATE TABLE `site_camping` (
  `id_site` bigint NOT NULL,
  `capacite` int NOT NULL,
  `localisation` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `prix_par_nuit` double NOT NULL,
  `statut_dispo` enum('COMPLET','DISPONIBLE','INDISPONIBLE') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `site_camping`
--

INSERT INTO `site_camping` (`id_site`, `capacite`, `localisation`, `nom`, `prix_par_nuit`, `statut_dispo`) VALUES
(1, 25, 'ICHKEUL', 'ICHKEUL HIKE', 300, 'DISPONIBLE'),
(2, 20, 'Hammamet', 'Camping Hammamet', 50, 'DISPONIBLE'),
(3, 10, 'Tabarka', 'Camping Tabarka', 70, 'DISPONIBLE'),
(4, 5, 'Tozeur', 'Camping Tozeur', 40, 'INDISPONIBLE'),
(5, 15, 'Ain Draham', 'Camping Ain Draham', 60, 'DISPONIBLE'),
(6, 30, 'Bizerte', 'Camping Bizerte Beach', 90, 'DISPONIBLE'),
(7, 12, 'Sousse', 'Camping Sousse Nature', 55, 'DISPONIBLE'),
(8, 8, 'Zaghouan', 'Camping Zaghouan Mountain', 45, 'DISPONIBLE'),
(9, 6, 'Kef', 'Camping Kef Adventure', 35, 'DISPONIBLE');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inscription_site`
--
ALTER TABLE `inscription_site`
  ADD PRIMARY KEY (`id_inscription`),
  ADD KEY `FKd8ad4p0swr1i7lhnx868p3vr6` (`site_camping_id_site`);

--
-- Indexes for table `site_camping`
--
ALTER TABLE `site_camping`
  ADD PRIMARY KEY (`id_site`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inscription_site`
--
ALTER TABLE `inscription_site`
  MODIFY `id_inscription` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `site_camping`
--
ALTER TABLE `site_camping`
  MODIFY `id_site` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inscription_site`
--
ALTER TABLE `inscription_site`
  ADD CONSTRAINT `FKd8ad4p0swr1i7lhnx868p3vr6` FOREIGN KEY (`site_camping_id_site`) REFERENCES `site_camping` (`id_site`);

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `id` bigint NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` longtext,
  `categorie` enum('GUIDED_TOUR','CAMPING_ACTIVITY','WORKSHOP','WELLNESS','RESTORATION','SOCIAL_EVENT','ADVENTURE','EDUCATIONAL') NOT NULL,
  `statut` enum('SCHEDULED','ONGOING','COMPLETED','CANCELLED','POSTPONED') NOT NULL,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `lieu` varchar(255) NOT NULL,
  `capacite_max` int NOT NULL,
  `capacite_waitlist` int NOT NULL DEFAULT 10,
  `prix` decimal(10,2) NOT NULL,
  `duree_minutes` int NOT NULL,
  `organisateur_id` bigint NOT NULL,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `reservation`
--

CREATE TABLE `reservation` (
  `id` bigint NOT NULL,
  `utilisateur_id` bigint NOT NULL,
  `event_id` bigint NOT NULL,
  `statut` enum('PENDING','CONFIRMED','PAID','NO_SHOW','CANCELLED','REFUNDED') NOT NULL,
  `nombre_participants` int NOT NULL,
  `prix_total` decimal(10,2) NOT NULL,
  `est_en_attente` boolean NOT NULL DEFAULT false,
  `statut_paiement` enum('UNPAID','PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `remarques` longtext,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `date_paiement` datetime,
  `transaction_id` varchar(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_event_organisateur` (`organisateur_id`);

--
-- Indexes for table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_reservation_utilisateur` (`utilisateur_id`),
  ADD KEY `FK_reservation_event` (`event_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `FK_event_organisateur` FOREIGN KEY (`organisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `FK_reservation_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_reservation_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
