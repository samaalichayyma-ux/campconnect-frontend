package com.esprit.campconnect.InscriptionSite.repository;

import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import com.esprit.campconnect.InscriptionSite.entity.StatutInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InscriptionSiteRepository extends JpaRepository<InscriptionSite, Long> {

    // optional useful method
    List<InscriptionSite> findBySiteCamping_IdSite(Long idSite);

    @Query("""
           SELECT COALESCE(SUM(i.numberOfGuests), 0)
           FROM InscriptionSite i
           WHERE i.siteCamping.idSite = :siteId
           AND i.statut = :statut
           """)
    Integer sumGuestsBySiteAndStatut(@Param("siteId") Long siteId,
                                     @Param("statut") StatutInscription statut);

    List<InscriptionSite> findByUtilisateur_Id(Long utilisateurId);

    @Query("""
       SELECT COALESCE(SUM(i.numberOfGuests), 0)
       FROM InscriptionSite i
       WHERE i.siteCamping.idSite = :siteId
       AND i.statut = :statut
       AND i.dateDebut < :dateFin
       AND i.dateFin > :dateDebut
       """)
    Integer sumGuestsBySiteAndStatutAndDateOverlap(@Param("siteId") Long siteId,
                                                   @Param("statut") StatutInscription statut,
                                                   @Param("dateDebut") LocalDate dateDebut,
                                                   @Param("dateFin") LocalDate dateFin);

    List<InscriptionSite> findBySiteCamping_Owner_Id(Long ownerId);

    @Query("""
       SELECT COUNT(i)
       FROM InscriptionSite i
       WHERE i.siteCamping.idSite = :siteId
       AND i.statut = com.esprit.campconnect.InscriptionSite.entity.StatutInscription.CONFIRMED
       """)
    Long countConfirmedBookingsBySiteId(@Param("siteId") Long siteId);
}
