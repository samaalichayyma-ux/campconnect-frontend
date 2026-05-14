package com.esprit.campconnect.Event.Service;

import com.esprit.campconnect.Event.DTO.EventDuplicateRequestDTO;
import com.esprit.campconnect.Event.DTO.EventImageDTO;
import com.esprit.campconnect.Event.DTO.EventRequestDTO;
import com.esprit.campconnect.Event.DTO.EventResponseDTO;
import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;

public interface IEventService {

    // CRUD operations
    EventResponseDTO createEvent(EventRequestDTO eventDTO, Long organizerId);
    EventResponseDTO getEventById(Long id);
    List<EventResponseDTO> getAllEvents();
    List<EventResponseDTO> getPublishedEvents();
    List<EventResponseDTO> getEventsByOrganizer(Long organizerId);
    EventResponseDTO updateEvent(Long id, EventRequestDTO eventDTO);
    void deleteEvent(Long id);
    EventResponseDTO publishEvent(Long eventId);
    EventResponseDTO unpublishEvent(Long eventId);
    List<EventResponseDTO> duplicateEvent(Long sourceEventId, EventDuplicateRequestDTO requestDTO, Long organizerId);
    void addFavorite(Long eventId, Long userId);
    void removeFavorite(Long eventId, Long userId);
    List<EventResponseDTO> getFavoriteEvents(Long userId);

    // Image management
    EventResponseDTO uploadEventImages(Long eventId, String bannerImage, String thumbnailImage, String galleryImages);

    // Search and filter operations
    List<EventResponseDTO> getEventsByCategory(EventCategory categorie);
    List<EventResponseDTO> getEventsByStatus(EventStatus statut);
    List<EventResponseDTO> getUpcomingEvents();
    List<EventResponseDTO> searchEvents(String keyword);
    List<EventResponseDTO> getEventsByLocation(String lieu);

    // Availability and capacity management
    List<EventResponseDTO> getAvailableEvents();
    boolean isEventAvailable(Long eventId);
    Integer getAvailableSeats(Long eventId);
    Long getParticipantCount(Long eventId);
    Long getWaitlistCount(Long eventId);

    // Event status management
    void startEvent(Long eventId);
    void completeEvent(Long eventId);
    void cancelEvent(Long eventId, String reason);
    void postponeEvent(Long eventId, LocalDateTime newStartDate, LocalDateTime newEndDate);
    void synchronizeLifecycleStatuses();

    // Analytics
    List<EventResponseDTO> getEventsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    Double calculateEventRevenue(Long eventId);
    Integer getTotalParticipantsForOrganizer(Long organizerId);

    // ============== IMAGE MANAGEMENT ==============

    /**
     * Add a single image to an existing event
     */
    EventResponseDTO addImageToEvent(Long eventId, MultipartFile imageFile);

    /**
     * Add one or more images to an existing event
     */
    EventResponseDTO addImagesToEvent(Long eventId, List<MultipartFile> imageFiles, boolean makePrimary);

    /**
     * Create an event with multiple images
     */
    EventResponseDTO createEventWithImages(EventRequestDTO eventDTO, List<MultipartFile> imageFiles, Long organizerId);

    /**
     * Delete a specific image from an event
     */
    void deleteEventImage(Long eventId, Long imageId);

    /**
     * Set an image as the primary/main image for an event
     */
    EventResponseDTO setImageAsPrimary(Long eventId, Long imageId);

    /**
     * Get a specific event image by ID
     */
    EventImageDTO getEventImageById(Long imageId);

    /**
     * Get all images for a specific event
     */
    List<EventImageDTO> getEventImages(Long eventId);
}
