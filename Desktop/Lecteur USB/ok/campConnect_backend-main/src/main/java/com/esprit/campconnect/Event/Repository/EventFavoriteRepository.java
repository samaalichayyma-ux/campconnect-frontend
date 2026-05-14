package com.esprit.campconnect.Event.Repository;

import com.esprit.campconnect.Event.Entity.EventFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EventFavoriteRepository extends JpaRepository<EventFavorite, Long> {

    boolean existsByUtilisateurIdAndEventId(Long utilisateurId, Long eventId);

    @Query("""
            SELECT ef
            FROM EventFavorite ef
            JOIN FETCH ef.event e
            JOIN FETCH e.organizer
            WHERE ef.utilisateur.id = :utilisateurId
            ORDER BY ef.dateCreation DESC
            """)
    List<EventFavorite> findByUtilisateurIdWithEventOrderByDateCreationDesc(@Param("utilisateurId") Long utilisateurId);

    @Query("""
            SELECT ef.event.id AS eventId, COUNT(ef.id) AS favoriteCount
            FROM EventFavorite ef
            WHERE ef.event.id IN :eventIds
            GROUP BY ef.event.id
            """)
    List<EventFavoriteCountView> countFavoritesByEventIds(@Param("eventIds") Collection<Long> eventIds);

    void deleteByUtilisateurIdAndEventId(Long utilisateurId, Long eventId);

    interface EventFavoriteCountView {
        Long getEventId();

        Long getFavoriteCount();
    }
}
