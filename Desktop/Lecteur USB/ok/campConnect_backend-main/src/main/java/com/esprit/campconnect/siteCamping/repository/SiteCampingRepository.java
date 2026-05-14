package com.esprit.campconnect.siteCamping.repository;

import com.esprit.campconnect.siteCamping.entity.SiteCamping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SiteCampingRepository extends JpaRepository<SiteCamping, Long> {
    List<SiteCamping> findByOwner_Id(Long ownerId);

    @Query("""
           SELECT s
           FROM SiteCamping s
           WHERE s.statutDispo <> com.esprit.campconnect.siteCamping.entity.StatutDispo.CLOSED
           ORDER BY s.idSite DESC
           """)
    List<SiteCamping> findAllVisibleSites();

}