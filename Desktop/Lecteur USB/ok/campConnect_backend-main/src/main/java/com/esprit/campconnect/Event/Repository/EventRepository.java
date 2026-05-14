package com.esprit.campconnect.Event.Repository;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Override
    @EntityGraph(attributePaths = "organizer")
    List<Event> findAll();

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByCategorie(EventCategory categorie);

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByStatut(EventStatus statut);

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByDateDebutAfterOrderByDateDebut(LocalDateTime dateDebut);

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByOrganizerId(Long organizerId);

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByPublishedTrueOrderByDateDebutAsc();

    @EntityGraph(attributePaths = "organizer")
    @Query("SELECT e FROM Event e WHERE e.dateDebut >= :dateDebut AND e.dateFin <= :dateFin")
    List<Event> findEventsBetweenDates(
            @Param("dateDebut") LocalDateTime dateDebut,
            @Param("dateFin") LocalDateTime dateFin
    );

    @EntityGraph(attributePaths = "organizer")
    @Query("""
            SELECT e
            FROM Event e
            WHERE e.statut = 'SCHEDULED'
              AND e.capaciteMax > (
                    SELECT COALESCE(SUM(r.nombreParticipants), 0)
                    FROM Reservation r
                    WHERE r.event.id = e.id
                      AND r.statut IN ('CONFIRMED', 'PAID')
              )
            """)
    List<Event> findEventsWithAvailableSpots();

    @EntityGraph(attributePaths = "organizer")
    @Query("SELECT e FROM Event e WHERE LOWER(e.titre) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchByKeyword(@Param("keyword") String keyword);

    @EntityGraph(attributePaths = "organizer")
    List<Event> findByLieuContainingIgnoreCase(String lieu);
}
