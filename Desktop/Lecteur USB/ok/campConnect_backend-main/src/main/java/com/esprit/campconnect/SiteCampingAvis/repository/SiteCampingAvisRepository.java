package com.esprit.campconnect.SiteCampingAvis.repository;

import com.esprit.campconnect.SiteCampingAvis.entity.SiteCampingAvis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteCampingAvisRepository extends JpaRepository<SiteCampingAvis, Long> {
    List<SiteCampingAvis> findBySiteCamping_IdSite(Long siteId);
    List<SiteCampingAvis> findBySiteCamping_Owner_Id(Long ownerId);

    @Query("""
           SELECT AVG(a.note)
           FROM SiteCampingAvis a
           WHERE a.siteCamping.idSite = :siteId
           AND a.note IS NOT NULL
           """)
    Double getAverageRatingBySiteId(@Param("siteId") Long siteId);

    @Query("""
           SELECT COUNT(a)
           FROM SiteCampingAvis a
           WHERE a.siteCamping.idSite = :siteId
           AND a.note IS NOT NULL
           """)
    Long countRatingsBySiteId(@Param("siteId") Long siteId);
}