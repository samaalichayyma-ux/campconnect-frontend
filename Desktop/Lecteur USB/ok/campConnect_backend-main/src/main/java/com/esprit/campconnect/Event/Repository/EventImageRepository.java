package com.esprit.campconnect.Event.Repository;

import com.esprit.campconnect.Event.Entity.EventImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventImageRepository extends JpaRepository<EventImage, Long> {

    /**
     * Find all images for a specific event
     */
    List<EventImage> findByEventId(Long eventId);

    /**
     * Find all images for an event ordered by display order
     */
    List<EventImage> findByEventIdOrderByDisplayOrder(Long eventId);

    /**
     * Find the primary image for an event
     */
    Optional<EventImage> findByEventIdAndIsPrimaryTrue(Long eventId);

    /**
     * Find images by event and primary flag
     */
    List<EventImage> findByEventIdAndIsPrimary(Long eventId, Boolean isPrimary);

    /**
     * Count images for an event
     */
    long countByEventId(Long eventId);

    /**
     * Delete all images for an event
     */
    void deleteByEventId(Long eventId);

    /**
     * Check if an image exists for an event
     */
    boolean existsByIdAndEventId(Long imageId, Long eventId);

    /**
     * Find image by ID and Event ID
     */
    Optional<EventImage> findByIdAndEventId(Long imageId, Long eventId);

    /**
     * Get the highest display order for an event
     */
    @Query("SELECT COALESCE(MAX(ei.displayOrder), -1) FROM EventImage ei WHERE ei.event.id = :eventId")
    Integer getMaxDisplayOrderForEvent(@Param("eventId") Long eventId);
}
