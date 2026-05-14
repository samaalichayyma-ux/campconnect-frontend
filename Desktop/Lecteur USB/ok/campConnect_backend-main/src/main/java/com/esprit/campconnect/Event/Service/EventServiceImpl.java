package com.esprit.campconnect.Event.Service;

import com.esprit.campconnect.Event.DTO.EventDuplicateRequestDTO;
import com.esprit.campconnect.Event.DTO.EventFeedbackDTO;
import com.esprit.campconnect.Event.DTO.EventImageDTO;
import com.esprit.campconnect.Event.DTO.EventRequestDTO;
import com.esprit.campconnect.Event.DTO.EventResponseDTO;
import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Entity.EventFavorite;
import com.esprit.campconnect.Event.Entity.EventImage;
import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Enum.RecurrenceFrequency;
import com.esprit.campconnect.Event.Repository.EventFavoriteRepository;
import com.esprit.campconnect.Event.Repository.EventImageRepository;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import com.esprit.campconnect.Reservation.Service.UserNotificationService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.config.GoogleMapsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EventServiceImpl implements IEventService {

    private final EventRepository eventRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EventFavoriteRepository eventFavoriteRepository;
    private final EventImageRepository eventImageRepository;
    private final ReservationRepository reservationRepository;
    private final UserNotificationService userNotificationService;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;
    private final GoogleMapsService googleMapsService;

    @Override
    public EventResponseDTO createEvent(EventRequestDTO eventDTO, Long organizerId) {
        log.info("Creating new event organized by user: {}", organizerId);

        Utilisateur organizer = utilisateurRepository.findById(organizerId)
                .orElseThrow(() -> notFound("Organizer not found with id: " + organizerId));

        Event event = new Event();
        event.setTitre(eventDTO.getTitre());
        event.setDescription(eventDTO.getDescription());
        event.setCategorie(eventDTO.getCategorie());
        event.setStatut(EventStatus.SCHEDULED);
        event.setDateDebut(eventDTO.getDateDebut());
        event.setDateFin(eventDTO.getDateFin());
        event.setLieu(eventDTO.getLieu());
        event.setLatitude(eventDTO.getLatitude());
        event.setLongitude(eventDTO.getLongitude());
        event.setGooglePlaceId(blankToNull(eventDTO.getGooglePlaceId()));
        event.setCapaciteMax(eventDTO.getCapaciteMax());
        event.setCapaciteWaitlist(resolveWaitlistCapacity(eventDTO.getCapaciteWaitlist(), 10));
        event.setReservationApprovalRequired(resolveReservationApprovalRequired(eventDTO.getReservationApprovalRequired(), true));
        event.setPrix(eventDTO.getPrix());
        event.setDureeMinutes(eventDTO.getDureeMinutes());
        event.setBannerImage(cleanImageInput(eventDTO.getBannerImage()));
        event.setThumbnailImage(cleanImageInput(eventDTO.getThumbnailImage()));
        event.setGalleryImages(cleanImageInput(eventDTO.getGalleryImages()));
        event.setOrganizer(organizer);
        applyPublicationState(event, eventDTO.getPublished(), true);

        Event savedEvent = eventRepository.save(event);
        log.info("Event created successfully with id: {}", savedEvent.getId());
        return mapToResponseDTO(savedEvent);
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponseDTO getEventById(Long id) {
        log.info("Fetching event with id: {}", id);
        return mapToResponseDTO(getEventOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getAllEvents() {
        log.info("Fetching all events");
        return mapEventsToSummaryDTOs(eventRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getPublishedEvents() {
        log.info("Fetching published events");
        return mapEventsToSummaryDTOs(eventRepository.findByPublishedTrueOrderByDateDebutAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getEventsByOrganizer(Long organizerId) {
        log.info("Fetching events for organizer: {}", organizerId);
        return mapEventsToSummaryDTOs(eventRepository.findByOrganizerId(organizerId));
    }

    @Override
    public EventResponseDTO updateEvent(Long id, EventRequestDTO eventDTO) {
        log.info("Updating event with id: {}", id);

        Event event = getEventOrThrow(id);
        if (event.getStatut() == EventStatus.ONGOING || event.getStatut() == EventStatus.COMPLETED) {
            throw badRequest("Cannot update an event that is ongoing or completed");
        }

        boolean currentPublished = Boolean.TRUE.equals(event.getPublished());
        boolean nextPublished = eventDTO.getPublished() != null
                ? Boolean.TRUE.equals(eventDTO.getPublished())
                : currentPublished;
        if (currentPublished && !nextPublished) {
            ensureCanMoveToDraft(event);
        }

        event.setTitre(eventDTO.getTitre());
        event.setDescription(eventDTO.getDescription());
        event.setCategorie(eventDTO.getCategorie());
        event.setDateDebut(eventDTO.getDateDebut());
        event.setDateFin(eventDTO.getDateFin());
        event.setLieu(eventDTO.getLieu());
        event.setLatitude(eventDTO.getLatitude());
        event.setLongitude(eventDTO.getLongitude());
        event.setGooglePlaceId(blankToNull(eventDTO.getGooglePlaceId()));
        event.setCapaciteMax(eventDTO.getCapaciteMax());
        event.setCapaciteWaitlist(resolveWaitlistCapacity(eventDTO.getCapaciteWaitlist(), event.getCapaciteWaitlist()));
        event.setReservationApprovalRequired(resolveReservationApprovalRequired(
                eventDTO.getReservationApprovalRequired(),
                resolveReservationApprovalRequired(event.getReservationApprovalRequired(), true)
        ));
        event.setPrix(eventDTO.getPrix());
        event.setDureeMinutes(eventDTO.getDureeMinutes());

        if (eventDTO.getBannerImage() != null) {
            event.setBannerImage(cleanImageInput(eventDTO.getBannerImage()));
        }
        if (eventDTO.getThumbnailImage() != null) {
            event.setThumbnailImage(cleanImageInput(eventDTO.getThumbnailImage()));
        }
        if (eventDTO.getGalleryImages() != null) {
            event.setGalleryImages(cleanImageInput(eventDTO.getGalleryImages()));
        }

        applyPublicationState(event, eventDTO.getPublished(), currentPublished);
        event.setDateModification(LocalDateTime.now());
        Event updatedEvent = eventRepository.save(event);
        log.info("Event updated successfully");
        return mapToResponseDTO(updatedEvent);
    }

    @Override
    public void deleteEvent(Long id) {
        log.info("Deleting event with id: {}", id);

        Event event = getEventOrThrow(id);
        if (event.getStatut() == EventStatus.ONGOING || event.getStatut() == EventStatus.COMPLETED) {
            throw badRequest("Cannot delete an event that is ongoing or completed");
        }

        eventRepository.delete(event);
        log.info("Event deleted successfully");
    }

    @Override
    public EventResponseDTO publishEvent(Long eventId) {
        log.info("Publishing event with id: {}", eventId);

        Event event = getEventOrThrow(eventId);
        applyPublicationState(event, true, true);
        event.setDateModification(LocalDateTime.now());
        return mapToResponseDTO(eventRepository.save(event));
    }

    @Override
    public EventResponseDTO unpublishEvent(Long eventId) {
        log.info("Moving event {} to draft mode", eventId);

        Event event = getEventOrThrow(eventId);
        ensureCanMoveToDraft(event);
        applyPublicationState(event, false, true);
        event.setDateModification(LocalDateTime.now());
        return mapToResponseDTO(eventRepository.save(event));
    }

    @Override
    public List<EventResponseDTO> duplicateEvent(Long sourceEventId, EventDuplicateRequestDTO requestDTO, Long organizerId) {
        log.info("Duplicating event {} with recurrence {}", sourceEventId, requestDTO != null ? requestDTO.getFrequency() : null);

        if (requestDTO == null || requestDTO.getFrequency() == null || requestDTO.getOccurrences() == null) {
            throw badRequest("Recurrence frequency and occurrences are required");
        }

        Event sourceEvent = getEventOrThrow(sourceEventId);
        Utilisateur requestedOrganizer = utilisateurRepository.findById(organizerId)
                .orElseThrow(() -> notFound("Organizer not found with id: " + organizerId));
        Utilisateur copyOrganizer = sourceEvent.getOrganizer() != null ? sourceEvent.getOrganizer() : requestedOrganizer;

        List<EventResponseDTO> duplicates = new ArrayList<>();
        for (int occurrenceIndex = 1; occurrenceIndex <= requestDTO.getOccurrences(); occurrenceIndex++) {
            Event duplicate = new Event();
            duplicate.setTitre(buildRecurringTitle(sourceEvent.getTitre(), requestDTO.getFrequency(), occurrenceIndex));
            duplicate.setDescription(sourceEvent.getDescription());
            duplicate.setCategorie(sourceEvent.getCategorie());
            duplicate.setStatut(EventStatus.SCHEDULED);
            duplicate.setDateDebut(shiftRecurrenceDate(sourceEvent.getDateDebut(), requestDTO.getFrequency(), occurrenceIndex));
            duplicate.setDateFin(shiftRecurrenceDate(sourceEvent.getDateFin(), requestDTO.getFrequency(), occurrenceIndex));
            duplicate.setLieu(sourceEvent.getLieu());
            duplicate.setLatitude(sourceEvent.getLatitude());
            duplicate.setLongitude(sourceEvent.getLongitude());
            duplicate.setGooglePlaceId(blankToNull(sourceEvent.getGooglePlaceId()));
            duplicate.setCapaciteMax(sourceEvent.getCapaciteMax());
            duplicate.setCapaciteWaitlist(resolveWaitlistCapacity(sourceEvent.getCapaciteWaitlist(), 10));
            duplicate.setReservationApprovalRequired(resolveReservationApprovalRequired(sourceEvent.getReservationApprovalRequired(), true));
            duplicate.setPrix(sourceEvent.getPrix());
            duplicate.setDureeMinutes(sourceEvent.getDureeMinutes());
            duplicate.setBannerImage(cleanImageInput(sourceEvent.getBannerImage()));
            duplicate.setThumbnailImage(cleanImageInput(sourceEvent.getThumbnailImage()));
            duplicate.setGalleryImages(cleanImageInput(sourceEvent.getGalleryImages()));
            duplicate.setSourceEventId(sourceEvent.getId());
            duplicate.setRecurrenceFrequency(requestDTO.getFrequency());
            duplicate.setOrganizer(copyOrganizer);
            applyPublicationState(duplicate, requestDTO.getPublishCopies(), false);

            Event savedDuplicate = eventRepository.save(duplicate);
            duplicateEventImages(sourceEvent, savedDuplicate);
            duplicates.add(getEventById(savedDuplicate.getId()));
        }

        return duplicates;
    }

    @Override
    public void addFavorite(Long eventId, Long userId) {
        log.info("Adding favorite for user {} on event {}", userId, eventId);

        if (eventFavoriteRepository.existsByUtilisateurIdAndEventId(userId, eventId)) {
            return;
        }

        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> notFound("User not found with id: " + userId));
        Event event = getEventOrThrow(eventId);

        EventFavorite favorite = new EventFavorite();
        favorite.setUtilisateur(utilisateur);
        favorite.setEvent(event);
        favorite.setDateCreation(LocalDateTime.now());
        eventFavoriteRepository.save(favorite);
    }

    @Override
    public void removeFavorite(Long eventId, Long userId) {
        log.info("Removing favorite for user {} on event {}", userId, eventId);
        eventFavoriteRepository.deleteByUtilisateurIdAndEventId(userId, eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getFavoriteEvents(Long userId) {
        log.info("Fetching favorite events for user {}", userId);
        List<Event> favoriteEvents = eventFavoriteRepository.findByUtilisateurIdWithEventOrderByDateCreationDesc(userId).stream()
                .map(EventFavorite::getEvent)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return mapEventsToSummaryDTOs(favoriteEvents);
    }

    @Override
    public EventResponseDTO uploadEventImages(Long eventId, String bannerImage, String thumbnailImage, String galleryImages) {
        log.info("Updating legacy image references for event {}", eventId);

        Event event = getEventOrThrow(eventId);
        if (bannerImage != null) {
            event.setBannerImage(cleanImageInput(bannerImage));
        }
        if (thumbnailImage != null) {
            event.setThumbnailImage(cleanImageInput(thumbnailImage));
        }
        if (galleryImages != null) {
            event.setGalleryImages(cleanImageInput(galleryImages));
        }

        event.setDateModification(LocalDateTime.now());
        return mapToResponseDTO(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getEventsByCategory(EventCategory categorie) {
        log.info("Fetching events by category: {}", categorie);
        return mapEventsToSummaryDTOs(eventRepository.findByCategorie(categorie));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getEventsByStatus(EventStatus statut) {
        log.info("Fetching events by status: {}", statut);
        return mapEventsToSummaryDTOs(eventRepository.findAll()).stream()
                .filter(event -> event.getStatut() == statut)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getUpcomingEvents() {
        log.info("Fetching upcoming events");
        return mapEventsToSummaryDTOs(eventRepository.findByDateDebutAfterOrderByDateDebut(LocalDateTime.now()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> searchEvents(String keyword) {
        log.info("Searching events with keyword: {}", keyword);
        return mapEventsToSummaryDTOs(eventRepository.searchByKeyword(keyword));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getEventsByLocation(String lieu) {
        log.info("Fetching events by location: {}", lieu);
        return mapEventsToSummaryDTOs(eventRepository.findByLieuContainingIgnoreCase(lieu));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getAvailableEvents() {
        log.info("Fetching available events");
        LocalDateTime now = LocalDateTime.now();
        List<Event> reservableEvents = eventRepository.findAll().stream()
                .filter(event -> isReservationOpen(event, resolveLifecycleStatus(event, now), now))
                .collect(Collectors.toList());

        EventResponseMetricsContext metricsContext = buildEventResponseMetricsContext(reservableEvents);
        return reservableEvents.stream()
                .filter(event -> {
                    EventResponseMetrics metrics = metricsContext.get(event.getId());
                    return !isFullyBooked(event.getCapaciteMax(), metrics.participantsCount());
                })
                .map(event -> mapToResponseDTO(event, metricsContext, false, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEventAvailable(Long eventId) {
        Event event = getEventOrThrow(eventId);
        LocalDateTime now = LocalDateTime.now();
        EventStatus effectiveStatus = resolveLifecycleStatus(event, now);
        if (!isReservationOpen(event, effectiveStatus, now)) {
            return false;
        }

        EventResponseMetrics metrics = buildEventResponseMetricsContext(List.of(event)).get(event.getId());
        return !isFullyBooked(event.getCapaciteMax(), metrics.participantsCount());
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getAvailableSeats(Long eventId) {
        Event event = getEventOrThrow(eventId);
        LocalDateTime now = LocalDateTime.now();
        if (!isReservationOpen(event, resolveLifecycleStatus(event, now), now)) {
            return 0;
        }

        EventResponseMetrics metrics = buildEventResponseMetricsContext(List.of(event)).get(event.getId());
        return calculateAvailableSeats(event.getCapaciteMax(), metrics.participantsCount());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getParticipantCount(Long eventId) {
        Event event = getEventOrThrow(eventId);
        return buildEventResponseMetricsContext(List.of(event)).get(event.getId()).participantsCount();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getWaitlistCount(Long eventId) {
        Event event = getEventOrThrow(eventId);
        return buildEventResponseMetricsContext(List.of(event)).get(event.getId()).waitlistCount();
    }

    @Override
    public void startEvent(Long eventId) {
        log.info("Starting event with id: {}", eventId);

        Event event = getEventOrThrow(eventId);
        if (event.getStatut() != EventStatus.SCHEDULED) {
            throw badRequest("Only scheduled events can be started");
        }

        event.setStatut(EventStatus.ONGOING);
        event.setDateModification(LocalDateTime.now());
        eventRepository.save(event);
        log.info("Event started successfully");
    }

    @Override
    public void completeEvent(Long eventId) {
        log.info("Completing event with id: {}", eventId);

        Event event = getEventOrThrow(eventId);
        if (event.getStatut() != EventStatus.ONGOING) {
            throw badRequest("Only ongoing events can be completed");
        }

        event.setStatut(EventStatus.COMPLETED);
        event.setDateModification(LocalDateTime.now());
        eventRepository.save(event);
        log.info("Event completed successfully");
    }

    @Override
    public void cancelEvent(Long eventId, String reason) {
        log.info("Cancelling event with id: {}", eventId);

        Event event = getEventOrThrow(eventId);
        if (event.getStatut() == EventStatus.COMPLETED) {
            throw badRequest("Cannot cancel a completed event");
        }

        event.setStatut(EventStatus.CANCELLED);
        event.setDateModification(LocalDateTime.now());
        eventRepository.save(event);
        notifyEventCancelled(event, reason);
        log.info("Event cancelled with reason: {}", reason);
    }

    @Override
    public void postponeEvent(Long eventId, LocalDateTime newStartDate, LocalDateTime newEndDate) {
        log.info("Postponing event with id: {} to {}", eventId, newStartDate);

        Event event = getEventOrThrow(eventId);
        if (event.getStatut() == EventStatus.ONGOING || event.getStatut() == EventStatus.COMPLETED) {
            throw badRequest("Cannot postpone an event that is ongoing or completed");
        }

        LocalDateTime previousStart = event.getDateDebut();
        LocalDateTime previousEnd = event.getDateFin();
        event.setDateDebut(newStartDate);
        event.setDateFin(newEndDate);
        event.setStatut(EventStatus.POSTPONED);
        event.setDateModification(LocalDateTime.now());
        eventRepository.save(event);
        notifyEventPostponed(event, previousStart, previousEnd);
        log.info("Event postponed successfully");
    }

    @Override
    public void synchronizeLifecycleStatuses() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findAll();
        List<Event> eventsToUpdate = new ArrayList<>();

        for (Event event : events) {
            EventStatus effectiveStatus = resolveLifecycleStatus(event, now);
            if (effectiveStatus == null || effectiveStatus == event.getStatut()) {
                continue;
            }

            event.setStatut(effectiveStatus);
            event.setDateModification(now);
            eventsToUpdate.add(event);
        }

        if (eventsToUpdate.isEmpty()) {
            return;
        }

        eventRepository.saveAll(eventsToUpdate);
        log.info("Synchronized {} event lifecycle status(es)", eventsToUpdate.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponseDTO> getEventsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching events between {} and {}", startDate, endDate);
        return mapEventsToSummaryDTOs(eventRepository.findEventsBetweenDates(startDate, endDate));
    }

    @Override
    @Transactional(readOnly = true)
    public Double calculateEventRevenue(Long eventId) {
        log.info("Calculating revenue for event: {}", eventId);
        return reservationRepository.calculateEventRevenue(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getTotalParticipantsForOrganizer(Long organizerId) {
        log.info("Getting total participants for organizer: {}", organizerId);
        List<Event> organizerEvents = eventRepository.findByOrganizerId(organizerId);
        EventResponseMetricsContext metricsContext = buildEventResponseMetricsContext(organizerEvents);
        return organizerEvents.stream()
                .map(Event::getId)
                .map(metricsContext::get)
                .mapToInt(metrics -> (int) metrics.participantsCount())
                .sum();
    }

    @Override
    public EventResponseDTO addImageToEvent(Long eventId, MultipartFile imageFile) {
        return addImagesToEvent(eventId, List.of(imageFile), false);
    }

    @Override
    public EventResponseDTO addImagesToEvent(Long eventId, List<MultipartFile> imageFiles, boolean makePrimary) {
        List<MultipartFile> filesToStore = normalizeFiles(imageFiles);
        log.info("Adding {} image(s) to event {}", filesToStore.size(), eventId);

        if (filesToStore.isEmpty()) {
            throw badRequest("At least one image file is required");
        }

        Event event = getEventOrThrow(eventId);
        persistImages(event, filesToStore, makePrimary);
        syncEventImageReferences(event);
        return getEventById(eventId);
    }

    @Override
    public EventResponseDTO createEventWithImages(EventRequestDTO eventDTO, List<MultipartFile> imageFiles, Long organizerId) {
        List<MultipartFile> filesToStore = normalizeFiles(imageFiles);
        log.info("Creating event with {} image(s)", filesToStore.size());

        EventResponseDTO createdEvent = createEvent(eventDTO, organizerId);
        if (filesToStore.isEmpty()) {
            return createdEvent;
        }

        Event event = getEventOrThrow(createdEvent.getId());
        persistImages(event, filesToStore, false);
        syncEventImageReferences(event);
        return getEventById(createdEvent.getId());
    }

    @Override
    public void deleteEventImage(Long eventId, Long imageId) {
        log.info("Deleting image {} from event {}", imageId, eventId);

        Event event = getEventOrThrow(eventId);
        EventImage eventImage = eventImageRepository.findByIdAndEventId(imageId, eventId)
                .orElseThrow(() -> notFound("Image not found for this event"));

        String storedPath = eventImage.getImageUrl();
        eventImageRepository.delete(eventImage);
        eventImageRepository.flush();

        if (hasText(storedPath)) {
            fileStorageService.deleteFile(storedPath);
        }

        normalizeDisplayOrder(eventId);
        syncEventImageReferences(event);
        log.info("Image {} deleted successfully", imageId);
    }

    @Override
    public EventResponseDTO setImageAsPrimary(Long eventId, Long imageId) {
        log.info("Setting image {} as primary for event {}", imageId, eventId);

        Event event = getEventOrThrow(eventId);
        List<EventImage> images = getOrderedEventImages(eventId);
        if (images.isEmpty()) {
            throw notFound("No images found for this event");
        }

        boolean targetFound = false;
        for (EventImage image : images) {
            boolean shouldBePrimary = Objects.equals(image.getId(), imageId);
            if (shouldBePrimary) {
                targetFound = true;
            }
            if (!Objects.equals(image.getIsPrimary(), shouldBePrimary)) {
                image.setIsPrimary(shouldBePrimary);
                image.setLastModified(LocalDateTime.now());
            }
        }

        if (!targetFound) {
            throw notFound("Image not found for this event");
        }

        eventImageRepository.saveAll(images);
        syncEventImageReferences(event);
        log.info("Image {} set as primary for event {}", imageId, eventId);
        return getEventById(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public EventImageDTO getEventImageById(Long imageId) {
        log.info("Fetching event image with id: {}", imageId);

        EventImage eventImage = eventImageRepository.findById(imageId)
                .orElseThrow(() -> notFound("Image not found with id: " + imageId));

        return mapToImageDTO(eventImage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventImageDTO> getEventImages(Long eventId) {
        log.info("Fetching all images for event: {}", eventId);
        getEventOrThrow(eventId);
        return getOrderedEventImages(eventId).stream()
                .map(this::mapToImageDTO)
                .collect(Collectors.toList());
    }

    private List<EventResponseDTO> mapEventsToSummaryDTOs(List<Event> events) {
        EventResponseMetricsContext metricsContext = buildEventResponseMetricsContext(events);
        return events.stream()
                .map(event -> mapToResponseDTO(event, metricsContext, false, false))
                .collect(Collectors.toList());
    }

    private EventResponseDTO mapToResponseDTO(Event event) {
        return mapToResponseDTO(event, buildEventResponseMetricsContext(List.of(event)), true, true);
    }

    private EventResponseDTO mapToResponseDTO(
            Event event,
            EventResponseMetricsContext metricsContext,
            boolean includeUploadedImages,
            boolean includeFeedbackEntries
    ) {
        LocalDateTime now = LocalDateTime.now();
        EventStatus effectiveStatus = resolveLifecycleStatus(event, now);
        EventResponseMetrics metrics = metricsContext.get(event != null ? event.getId() : null);
        long participantsCount = metrics.participantsCount();
        long waitlistCount = metrics.waitlistCount();
        long favoriteCount = metrics.favoriteCount();
        double averageRating = metrics.averageRating();
        long feedbackCount = metrics.feedbackCount();
        boolean reservationOpen = isReservationOpen(event, effectiveStatus, now);
        int availableSeats = reservationOpen
                ? calculateAvailableSeats(event != null ? event.getCapaciteMax() : null, participantsCount)
                : 0;
        boolean fullyBooked = isFullyBooked(event != null ? event.getCapaciteMax() : null, participantsCount);
        double occupancyRate = calculateOccupancyRate(event != null ? event.getCapaciteMax() : null, participantsCount);

        EventResponseDTO dto = new EventResponseDTO();
        dto.setId(event.getId());
        dto.setTitre(event.getTitre());
        dto.setDescription(event.getDescription());
        dto.setCategorie(event.getCategorie());
        dto.setStatut(effectiveStatus);
        dto.setDateDebut(event.getDateDebut());
        dto.setDateFin(event.getDateFin());
        dto.setLieu(event.getLieu());
        dto.setLatitude(event.getLatitude());
        dto.setLongitude(event.getLongitude());
        dto.setGooglePlaceId(blankToNull(event.getGooglePlaceId()));
        dto.setCapaciteMax(event.getCapaciteMax());
        dto.setCapaciteWaitlist(event.getCapaciteWaitlist());
        dto.setPrix(event.getPrix());
        dto.setDureeMinutes(event.getDureeMinutes());
        dto.setPublished(Boolean.TRUE.equals(event.getPublished()));
        dto.setPublishedAt(event.getPublishedAt());
        dto.setSourceEventId(event.getSourceEventId());
        dto.setRecurrenceFrequency(event.getRecurrenceFrequency());
        String googleMapsUrl = googleMapsService.buildGoogleMapsUrl(event);
        dto.setGoogleMapsUrl(googleMapsUrl);
        dto.setHasMapLocation(googleMapsUrl != null);
        dto.setReservationApprovalRequired(resolveReservationApprovalRequired(event.getReservationApprovalRequired(), true));

        if (event.getOrganizer() != null) {
            dto.setOrganizerId(event.getOrganizer().getId());
            dto.setOrganizerNom(event.getOrganizer().getNom());
            dto.setOrganizerEmail(event.getOrganizer().getEmail());
        }

        dto.setDateCreation(event.getDateCreation());
        dto.setDateModification(event.getDateModification());
        dto.setParticipantsCount(participantsCount);
        dto.setWaitlistCount(waitlistCount);
        dto.setAvailableSeats(availableSeats);
        dto.setIsFullyBooked(fullyBooked);
        dto.setIsAlmostFull(reservationOpen && isAlmostFull(event != null ? event.getCapaciteMax() : null, participantsCount, fullyBooked));
        dto.setOccupancyRate(occupancyRate);
        dto.setFavoriteCount(favoriteCount);
        dto.setAverageRating(feedbackCount > 0 ? averageRating : 0D);
        dto.setFeedbackCount(feedbackCount);

        List<EventImageDTO> imageDTOs = !includeUploadedImages || event.getId() == null
                ? List.of()
                : getOrderedEventImages(event.getId()).stream()
                .map(this::mapToImageDTO)
                .collect(Collectors.toList());
        dto.setImages(imageDTOs);
        if (includeFeedbackEntries) {
            dto.setFeedbackEntries(event != null && event.getId() != null
                    ? buildEventFeedbackDTOs(event.getId())
                    : List.of());
        }

        List<String> uploadedImageUrls = imageDTOs.stream()
                .map(EventImageDTO::getImageUrl)
                .filter(this::hasText)
                .collect(Collectors.toList());
        List<String> legacyGalleryUrls = normalizeGalleryReferences(event.getGalleryImages());

        String uploadedPrimaryImageUrl = imageDTOs.stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()) && hasText(image.getImageUrl()))
                .map(EventImageDTO::getImageUrl)
                .findFirst()
                .orElse(uploadedImageUrls.stream().findFirst().orElse(null));

        String normalizedBanner = normalizeImageReference(event.getBannerImage());
        String normalizedThumbnail = normalizeImageReference(event.getThumbnailImage());
        String fallbackBanner = buildFallbackImageDataUri(event, false);
        String fallbackThumbnail = buildFallbackImageDataUri(event, true);

        dto.setPrimaryImageUrl(firstNonBlank(
                uploadedPrimaryImageUrl,
                normalizedBanner,
                normalizedThumbnail,
                legacyGalleryUrls.stream().findFirst().orElse(null),
                fallbackBanner
        ));
        dto.setBannerImage(firstNonBlank(
                uploadedPrimaryImageUrl,
                normalizedBanner,
                normalizedThumbnail,
                fallbackBanner
        ));
        dto.setThumbnailImage(firstNonBlank(
                uploadedPrimaryImageUrl,
                normalizedThumbnail,
                normalizedBanner,
                fallbackThumbnail
        ));

        List<String> galleryImageUrls = !uploadedImageUrls.isEmpty()
                ? uploadedImageUrls
                : !legacyGalleryUrls.isEmpty()
                ? legacyGalleryUrls
                : List.of(dto.getBannerImage());

        dto.setGalleryImageUrls(galleryImageUrls);
        dto.setGalleryImages(serializeGalleryUrls(galleryImageUrls));
        dto.setImageCount(resolveImageCount(imageDTOs, legacyGalleryUrls, normalizedBanner, normalizedThumbnail));

        return dto;
    }

    private EventResponseMetricsContext buildEventResponseMetricsContext(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return new EventResponseMetricsContext(Map.of());
        }

        List<Long> eventIds = events.stream()
                .map(Event::getId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (eventIds.isEmpty()) {
            return new EventResponseMetricsContext(Map.of());
        }

        Map<Long, Long> participantsByEventId = new HashMap<>();
        Map<Long, Long> waitlistByEventId = new HashMap<>();
        for (ReservationRepository.EventReservationStatsView stats : reservationRepository.summarizeParticipantsByEventIds(eventIds)) {
            if (stats.getEventId() == null) {
                continue;
            }
            participantsByEventId.put(stats.getEventId(), defaultLong(stats.getConfirmedParticipants()));
            waitlistByEventId.put(stats.getEventId(), defaultLong(stats.getWaitlistParticipants()));
        }

        Map<Long, Long> favoritesByEventId = new HashMap<>();
        for (EventFavoriteRepository.EventFavoriteCountView stats : eventFavoriteRepository.countFavoritesByEventIds(eventIds)) {
            if (stats.getEventId() == null) {
                continue;
            }
            favoritesByEventId.put(stats.getEventId(), defaultLong(stats.getFavoriteCount()));
        }

        Map<Long, Double> averageRatingsByEventId = new HashMap<>();
        Map<Long, Long> feedbackCountsByEventId = new HashMap<>();
        for (ReservationRepository.EventFeedbackSummaryView stats : reservationRepository.summarizeFeedbackByEventIds(eventIds)) {
            if (stats.getEventId() == null) {
                continue;
            }
            averageRatingsByEventId.put(stats.getEventId(), defaultDouble(stats.getAverageRating()));
            feedbackCountsByEventId.put(stats.getEventId(), defaultLong(stats.getFeedbackResponses()));
        }

        Map<Long, EventResponseMetrics> metricsByEventId = new HashMap<>();
        for (Long eventId : eventIds) {
            metricsByEventId.put(
                    eventId,
                    new EventResponseMetrics(
                            participantsByEventId.getOrDefault(eventId, 0L),
                            waitlistByEventId.getOrDefault(eventId, 0L),
                            favoritesByEventId.getOrDefault(eventId, 0L),
                            averageRatingsByEventId.getOrDefault(eventId, 0D),
                            feedbackCountsByEventId.getOrDefault(eventId, 0L)
                    )
            );
        }

        return new EventResponseMetricsContext(metricsByEventId);
    }

    private List<EventFeedbackDTO> buildEventFeedbackDTOs(Long eventId) {
        return reservationRepository.findSubmittedFeedbackByEventId(eventId).stream()
                .limit(6)
                .map(this::mapToFeedbackDTO)
                .collect(Collectors.toList());
    }

    private EventFeedbackDTO mapToFeedbackDTO(Reservation reservation) {
        EventFeedbackDTO dto = new EventFeedbackDTO();
        dto.setReviewerName(resolveReviewerName(reservation != null ? reservation.getUtilisateur() : null));
        dto.setRating(reservation != null ? reservation.getFeedbackRating() : null);
        dto.setComment(reservation != null ? reservation.getFeedbackComment() : null);
        dto.setSubmittedAt(reservation != null ? reservation.getFeedbackSubmittedAt() : null);
        return dto;
    }

    private void notifyEventCancelled(Event event, String reason) {
        getNotifiableReservationsForEvent(event.getId())
                .forEach(reservation -> userNotificationService.notifyEventCancelled(reservation, reason));
    }

    private void notifyEventPostponed(Event event, LocalDateTime previousStart, LocalDateTime previousEnd) {
        getNotifiableReservationsForEvent(event.getId())
                .forEach(reservation -> userNotificationService.notifyEventPostponed(reservation, previousStart, previousEnd));
    }

    private List<Reservation> getNotifiableReservationsForEvent(Long eventId) {
        return reservationRepository.findByEventIdWithDetails(eventId).stream()
                .filter(reservation -> reservation.getUtilisateur() != null)
                .filter(reservation -> reservation.getStatut() != ReservationStatus.CANCELLED)
                .filter(reservation -> reservation.getStatut() != ReservationStatus.REFUNDED)
                .filter(reservation -> reservation.getStatut() != ReservationStatus.NO_SHOW)
                .filter(reservation -> reservation.getStatut() != ReservationStatus.ATTENDED)
                .toList();
    }

    private EventImageDTO mapToImageDTO(EventImage eventImage) {
        EventImageDTO dto = new EventImageDTO();
        dto.setId(eventImage.getId());
        dto.setImageName(eventImage.getImageName());
        dto.setImageUrl(buildEventImageContentUrl(eventImage.getId()));
        dto.setDescription(eventImage.getDescription());
        dto.setIsPrimary(eventImage.getIsPrimary());
        dto.setDisplayOrder(eventImage.getDisplayOrder());
        dto.setMimeType(eventImage.getMimeType());
        dto.setFileSize(eventImage.getFileSize());
        if (eventImage.getEvent() != null) {
            dto.setEventId(eventImage.getEvent().getId());
        }
        dto.setUploadDate(eventImage.getUploadDate());
        dto.setLastModified(eventImage.getLastModified());
        dto.setIsAvailable(true);
        return dto;
    }

    private int calculateAvailableSeats(Integer capacity, long participantsCount) {
        int safeCapacity = capacity != null ? Math.max(0, capacity) : 0;
        return (int) Math.max(0L, safeCapacity - participantsCount);
    }

    private boolean isFullyBooked(Integer capacity, long participantsCount) {
        return capacity != null && participantsCount >= Math.max(0, capacity);
    }

    private double calculateOccupancyRate(Integer capacity, long participantsCount) {
        if (capacity == null || capacity <= 0) {
            return 0D;
        }

        return Math.min(1D, Math.max(0D, (double) participantsCount / capacity));
    }

    private boolean isAlmostFull(Integer capacity, long participantsCount, boolean fullyBooked) {
        if (fullyBooked || capacity == null || capacity <= 0) {
            return false;
        }

        int availableSeats = calculateAvailableSeats(capacity, participantsCount);
        int urgencyThreshold = Math.max(3, (int) Math.ceil(capacity * 0.15));
        return availableSeats > 0 && (availableSeats <= urgencyThreshold || calculateOccupancyRate(capacity, participantsCount) >= 0.8D);
    }

    private EventStatus resolveLifecycleStatus(Event event, LocalDateTime referenceTime) {
        if (event == null || event.getStatut() == null) {
            return null;
        }

        if (event.getStatut() == EventStatus.CANCELLED || event.getStatut() == EventStatus.COMPLETED) {
            return event.getStatut();
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        if (event.getDateFin() != null && !event.getDateFin().isAfter(effectiveReferenceTime)) {
            return EventStatus.COMPLETED;
        }

        if (event.getDateDebut() != null && !event.getDateDebut().isAfter(effectiveReferenceTime)) {
            return EventStatus.ONGOING;
        }

        return event.getStatut();
    }

    private boolean isReservationOpen(Event event, EventStatus effectiveStatus, LocalDateTime referenceTime) {
        if (event == null) {
            return false;
        }

        LocalDateTime effectiveReferenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
        EventStatus resolvedStatus = effectiveStatus != null ? effectiveStatus : resolveLifecycleStatus(event, effectiveReferenceTime);
        if (resolvedStatus == null
                || resolvedStatus == EventStatus.CANCELLED
                || resolvedStatus == EventStatus.COMPLETED
                || resolvedStatus == EventStatus.ONGOING) {
            return false;
        }

        return event.getDateDebut() == null || event.getDateDebut().isAfter(effectiveReferenceTime);
    }

    private int resolveImageCount(
            List<EventImageDTO> imageDTOs,
            List<String> legacyGalleryUrls,
            String normalizedBanner,
            String normalizedThumbnail
    ) {
        if (imageDTOs != null && !imageDTOs.isEmpty()) {
            return imageDTOs.size();
        }

        if (legacyGalleryUrls != null && !legacyGalleryUrls.isEmpty()) {
            return legacyGalleryUrls.size();
        }

        return hasText(normalizedBanner) || hasText(normalizedThumbnail) ? 1 : 0;
    }

    private long defaultLong(Long value) {
        return value != null ? value : 0L;
    }

    private double defaultDouble(Double value) {
        return value != null ? value : 0D;
    }

    private String resolveReviewerName(Utilisateur utilisateur) {
        if (utilisateur == null || !hasText(utilisateur.getNom())) {
            return "CampConnect guest";
        }

        return utilisateur.getNom().trim();
    }

    private Boolean resolveReservationApprovalRequired(Boolean requestedValue, boolean fallbackValue) {
        return requestedValue != null ? requestedValue : fallbackValue;
    }

    private void applyPublicationState(Event event, Boolean requestedPublished, boolean fallbackPublished) {
        boolean shouldPublish = requestedPublished != null ? Boolean.TRUE.equals(requestedPublished) : fallbackPublished;
        boolean wasPublished = Boolean.TRUE.equals(event.getPublished());
        event.setPublished(shouldPublish);
        if (shouldPublish) {
            event.setPublishedAt(wasPublished && event.getPublishedAt() != null ? event.getPublishedAt() : LocalDateTime.now());
        } else {
            event.setPublishedAt(null);
        }
    }

    private void ensureCanMoveToDraft(Event event) {
        boolean hasBlockingReservations = event.getReservations() != null && event.getReservations().stream()
                .anyMatch(reservation -> reservation.getStatut() != ReservationStatus.CANCELLED
                        && reservation.getStatut() != ReservationStatus.REFUNDED);

        if (hasBlockingReservations || event.getParticipantsCount() > 0 || event.getWaitlistCount() > 0) {
            throw badRequest("This event already has active reservations or waitlist requests and cannot be moved back to draft");
        }
    }

    private String buildRecurringTitle(String sourceTitle, RecurrenceFrequency frequency, int occurrenceIndex) {
        String normalizedTitle = firstNonBlank(sourceTitle, "Event");
        String label = switch (frequency) {
            case MONTHLY -> "Monthly";
            case YEARLY -> "Yearly";
            case WEEKLY -> "Weekly";
        };
        return normalizedTitle + " (" + label + " " + occurrenceIndex + ")";
    }

    private LocalDateTime shiftRecurrenceDate(LocalDateTime baseDate, RecurrenceFrequency frequency, int occurrenceIndex) {
        if (baseDate == null) {
            return null;
        }

        return switch (frequency) {
            case MONTHLY -> baseDate.plusMonths(occurrenceIndex);
            case YEARLY -> baseDate.plusYears(occurrenceIndex);
            case WEEKLY -> baseDate.plusWeeks(occurrenceIndex);
        };
    }

    private void duplicateEventImages(Event sourceEvent, Event duplicateEvent) {
        if (sourceEvent.getId() == null || duplicateEvent.getId() == null) {
            return;
        }

        List<EventImage> sourceImages = getOrderedEventImages(sourceEvent.getId());
        if (sourceImages.isEmpty()) {
            return;
        }

        List<String> storedPaths = new ArrayList<>();
        try {
            for (EventImage sourceImage : sourceImages) {
                byte[] imageBytes = readEventImageBytes(sourceImage);
                String imageName = firstNonBlank(sourceImage.getImageName(), "event-image.jpg");
                String storedPath = fileStorageService.storeFile(imageName, imageBytes);
                storedPaths.add(storedPath);

                EventImage duplicateImage = new EventImage();
                duplicateImage.setEvent(duplicateEvent);
                duplicateImage.setImageName(imageName);
                duplicateImage.setImageUrl(storedPath);
                duplicateImage.setImageData(Base64.getEncoder().encodeToString(imageBytes));
                duplicateImage.setDescription(sourceImage.getDescription());
                duplicateImage.setIsPrimary(Boolean.TRUE.equals(sourceImage.getIsPrimary()));
                duplicateImage.setDisplayOrder(sourceImage.getDisplayOrder() != null ? sourceImage.getDisplayOrder() : 0);
                duplicateImage.setMimeType(firstNonBlank(sourceImage.getMimeType(), "application/octet-stream"));
                duplicateImage.setFileSize((long) imageBytes.length);
                duplicateImage.setUploadDate(LocalDateTime.now());
                duplicateImage.setLastModified(LocalDateTime.now());
                eventImageRepository.save(duplicateImage);
            }

            syncEventImageReferences(duplicateEvent);
        } catch (IllegalArgumentException exception) {
            storedPaths.forEach(fileStorageService::deleteFile);
            throw badRequest(exception.getMessage());
        } catch (IOException exception) {
            storedPaths.forEach(fileStorageService::deleteFile);
            throw serverError("Failed to duplicate event images", exception);
        }
    }

    private byte[] readEventImageBytes(EventImage eventImage) throws IOException {
        if (hasText(eventImage.getImageData())) {
            String payload = eventImage.getImageData();
            int separatorIndex = payload.indexOf(',');
            if (separatorIndex >= 0) {
                payload = payload.substring(separatorIndex + 1);
            }
            return Base64.getDecoder().decode(payload);
        }

        if (!hasText(eventImage.getImageUrl())) {
            throw new IOException("No image content available to duplicate");
        }

        Path imagePath = resolveStoredImagePath(eventImage.getImageUrl());
        if (!Files.exists(imagePath)) {
            throw new IOException("Stored image file not found: " + eventImage.getImageUrl());
        }

        return Files.readAllBytes(imagePath);
    }

    private Path resolveStoredImagePath(String imagePath) {
        String normalizedPath = imagePath.replace('\\', '/').trim();
        Path directPath = Paths.get(imagePath);
        if (directPath.isAbsolute()) {
            return directPath.normalize();
        }

        Path relativePath = Paths.get(normalizedPath);
        if (Files.exists(relativePath)) {
            return relativePath.normalize();
        }

        int uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");
        if (uploadsIndex >= 0) {
            return Paths.get(normalizedPath.substring(uploadsIndex)).normalize();
        }

        return relativePath.normalize();
    }

    private void persistImages(Event event, List<MultipartFile> imageFiles, boolean makePrimary) {
        List<String> storedPaths = new ArrayList<>();
        List<EventImage> existingImages = getOrderedEventImages(event.getId());
        boolean hasPrimary = existingImages.stream().anyMatch(image -> Boolean.TRUE.equals(image.getIsPrimary()));

        if (makePrimary && !existingImages.isEmpty()) {
            existingImages.forEach(image -> image.setIsPrimary(false));
            eventImageRepository.saveAll(existingImages);
            hasPrimary = false;
        }

        int nextDisplayOrder = getNextDisplayOrder(event.getId());
        boolean assignPrimaryToNextSavedImage = !hasPrimary;

        try {
            for (MultipartFile imageFile : imageFiles) {
                byte[] imageBytes = imageFile.getBytes();
                String storedPath = fileStorageService.storeFile(imageFile, imageBytes);
                storedPaths.add(storedPath);

                EventImage eventImage = new EventImage();
                eventImage.setEvent(event);
                eventImage.setImageName(resolveImageName(imageFile));
                eventImage.setImageUrl(storedPath);
                eventImage.setImageData(Base64.getEncoder().encodeToString(imageBytes));
                eventImage.setMimeType(resolveMimeType(imageFile));
                eventImage.setFileSize(imageFile.getSize());
                eventImage.setDisplayOrder(nextDisplayOrder++);
                eventImage.setIsPrimary(assignPrimaryToNextSavedImage);
                eventImage.setUploadDate(LocalDateTime.now());
                eventImage.setLastModified(LocalDateTime.now());

                eventImageRepository.save(eventImage);
                assignPrimaryToNextSavedImage = false;
            }
        } catch (IllegalArgumentException exception) {
            storedPaths.forEach(fileStorageService::deleteFile);
            throw badRequest(exception.getMessage());
        } catch (IOException exception) {
            storedPaths.forEach(fileStorageService::deleteFile);
            throw serverError("Failed to upload event image", exception);
        }
    }

    private void syncEventImageReferences(Event event) {
        List<EventImage> orderedImages = getOrderedEventImages(event.getId());
        if (orderedImages.isEmpty()) {
            event.setBannerImage(null);
            event.setThumbnailImage(null);
            event.setGalleryImages(null);
            event.setDateModification(LocalDateTime.now());
            eventRepository.save(event);
            return;
        }

        EventImage primaryImage = orderedImages.stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                .findFirst()
                .orElse(orderedImages.get(0));

        boolean primaryAdjusted = false;
        for (EventImage image : orderedImages) {
            boolean shouldBePrimary = Objects.equals(image.getId(), primaryImage.getId());
            if (!Objects.equals(image.getIsPrimary(), shouldBePrimary)) {
                image.setIsPrimary(shouldBePrimary);
                image.setLastModified(LocalDateTime.now());
                primaryAdjusted = true;
            }
        }

        if (primaryAdjusted) {
            eventImageRepository.saveAll(orderedImages);
        }

        String primaryImageUrl = buildEventImageContentUrl(primaryImage.getId());
        List<String> galleryUrls = orderedImages.stream()
                .map(image -> buildEventImageContentUrl(image.getId()))
                .collect(Collectors.toList());

        event.setBannerImage(primaryImageUrl);
        event.setThumbnailImage(primaryImageUrl);
        event.setGalleryImages(serializeGalleryUrls(galleryUrls));
        event.setDateModification(LocalDateTime.now());
        eventRepository.save(event);
    }

    private void normalizeDisplayOrder(Long eventId) {
        List<EventImage> orderedImages = getOrderedEventImages(eventId);
        boolean updated = false;

        for (int index = 0; index < orderedImages.size(); index++) {
            EventImage image = orderedImages.get(index);
            if (!Objects.equals(image.getDisplayOrder(), index)) {
                image.setDisplayOrder(index);
                image.setLastModified(LocalDateTime.now());
                updated = true;
            }
        }

        if (updated) {
            eventImageRepository.saveAll(orderedImages);
        }
    }

    private List<EventImage> getOrderedEventImages(Long eventId) {
        return eventImageRepository.findByEventId(eventId).stream()
                .sorted(Comparator
                        .comparing((EventImage image) -> Boolean.TRUE.equals(image.getIsPrimary()))
                        .reversed()
                        .thenComparing(EventImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(EventImage::getId, Comparator.nullsLast(Long::compareTo)))
                .collect(Collectors.toList());
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> imageFiles) {
        if (imageFiles == null) {
            return List.of();
        }

        return imageFiles.stream()
                .filter(Objects::nonNull)
                .filter(file -> !file.isEmpty())
                .collect(Collectors.toList());
    }

    private int getNextDisplayOrder(Long eventId) {
        Integer maxDisplayOrder = eventImageRepository.getMaxDisplayOrderForEvent(eventId);
        return (maxDisplayOrder == null ? -1 : maxDisplayOrder) + 1;
    }

    private int resolveWaitlistCapacity(Integer requestedCapacity, Integer fallbackCapacity) {
        if (requestedCapacity != null) {
            return requestedCapacity;
        }
        if (fallbackCapacity != null) {
            return fallbackCapacity;
        }
        return 10;
    }

    private List<String> normalizeGalleryReferences(String galleryImages) {
        String normalizedGallery = blankToNull(galleryImages);
        if (normalizedGallery == null) {
            return List.of();
        }

        try {
            if (normalizedGallery.trim().startsWith("[")) {
                List<String> values = objectMapper.readValue(normalizedGallery, new TypeReference<List<String>>() { });
                return values.stream()
                        .map(this::normalizeImageReference)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
            }
        } catch (JsonProcessingException exception) {
            log.debug("Failed to parse galleryImages as JSON for event response", exception);
        }

        String normalizedSingleValue = normalizeImageReference(normalizedGallery);
        if (normalizedSingleValue == null) {
            return List.of();
        }

        return List.of(normalizedSingleValue);
    }

    private String serializeGalleryUrls(List<String> galleryUrls) {
        try {
            return objectMapper.writeValueAsString(galleryUrls.stream()
                    .filter(this::hasText)
                    .distinct()
                    .collect(Collectors.toList()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize event gallery URLs", exception);
        }
    }

    private String resolveImageName(MultipartFile imageFile) {
        return firstNonBlank(imageFile.getOriginalFilename(), "event-image");
    }

    private String resolveMimeType(MultipartFile imageFile) {
        return firstNonBlank(imageFile.getContentType(), "application/octet-stream");
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> notFound("Event not found with id: " + eventId));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String buildFallbackImageDataUri(Event event, boolean thumbnail) {
        String[] palette = getCategoryPalette(event.getCategorie());
        int width = thumbnail ? 400 : 1200;
        int height = thumbnail ? 250 : 400;
        int titleFontSize = thumbnail ? 24 : 46;
        int categoryFontSize = thumbnail ? 14 : 24;
        String safeTitle = escapeSvgText(firstNonBlank(event.getTitre(), "CampConnect Event"));
        String safeCategory = escapeSvgText(event.getCategorie() != null ? event.getCategorie().name().replace('_', ' ') : "EVENT");
        String safeLocation = escapeSvgText(firstNonBlank(event.getLieu(), "Discover the next adventure"));

        String svg = String.format(
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %d %d'>"
                        + "<defs>"
                        + "<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>"
                        + "<stop offset='0%%' stop-color='%s'/>"
                        + "<stop offset='100%%' stop-color='%s'/>"
                        + "</linearGradient>"
                        + "</defs>"
                        + "<rect width='100%%' height='100%%' fill='url(#bg)'/>"
                        + "<circle cx='%d' cy='%d' r='%d' fill='%s' fill-opacity='0.22'/>"
                        + "<circle cx='%d' cy='%d' r='%d' fill='%s' fill-opacity='0.18'/>"
                        + "<text x='7%%' y='20%%' font-family='Arial, sans-serif' font-size='%d' font-weight='700' fill='white' letter-spacing='2'>%s</text>"
                        + "<text x='7%%' y='56%%' font-family='Arial, sans-serif' font-size='%d' font-weight='700' fill='white'>%s</text>"
                        + "<text x='7%%' y='74%%' font-family='Arial, sans-serif' font-size='%d' fill='white' fill-opacity='0.9'>%s</text>"
                        + "</svg>",
                width,
                height,
                palette[0],
                palette[1],
                (int) (width * 0.82),
                (int) (height * 0.25),
                thumbnail ? 90 : 130,
                palette[2],
                (int) (width * 0.16),
                (int) (height * 0.82),
                thumbnail ? 70 : 110,
                palette[3],
                categoryFontSize,
                safeCategory,
                titleFontSize,
                safeTitle,
                thumbnail ? 15 : 22,
                safeLocation
        );

        return "data:image/svg+xml;charset=UTF-8," + URLEncoder.encode(svg, StandardCharsets.UTF_8);
    }

    private String[] getCategoryPalette(EventCategory category) {
        if (category == null) {
            return new String[]{"#1f4f46", "#0c2a24", "#d4af37", "#ffffff"};
        }

        return switch (category) {
            case ADVENTURE -> new String[]{"#2e6f40", "#112b1b", "#f6c453", "#dcefdc"};
            case CAMPING_ACTIVITY -> new String[]{"#6b4f2a", "#2f2210", "#f2d7a1", "#efe2c4"};
            case GUIDED_TOUR -> new String[]{"#1c5d99", "#0a2540", "#91c8f6", "#e6f4ff"};
            case RESTORATION -> new String[]{"#9c3d1e", "#43180c", "#ffcb77", "#ffe7c2"};
            case SOCIAL_EVENT -> new String[]{"#8b1e3f", "#3b0c1a", "#ff9fb2", "#ffe0e8"};
            case WELLNESS -> new String[]{"#3d7a6a", "#173730", "#c4f1de", "#ecfff7"};
            case WORKSHOP -> new String[]{"#5a4ea1", "#241d49", "#d4cbff", "#f0eeff"};
            case EDUCATIONAL -> new String[]{"#7c5a12", "#382805", "#f4dd92", "#fff5d7"};
        };
    }

    private String escapeSvgText(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String cleanImageInput(String value) {
        return blankToNull(value);
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeImageReference(String value) {
        String normalizedValue = blankToNull(value);
        if (normalizedValue == null) {
            return null;
        }

        if (normalizedValue.startsWith("data:")
                || normalizedValue.startsWith("http://")
                || normalizedValue.startsWith("https://")) {
            return normalizedValue;
        }

        String sanitized = normalizedValue.replace('\\', '/');
        if (sanitized.startsWith("/api/")) {
            return sanitized;
        }
        if (sanitized.startsWith("api/")) {
            return "/" + sanitized;
        }
        if (sanitized.startsWith("/events/")) {
            return "/api" + sanitized;
        }
        if (sanitized.startsWith("events/")) {
            return "/api/" + sanitized;
        }

        return null;
    }

    private String buildEventImageContentUrl(Long imageId) {
        return "/api/events/images/" + imageId + "/content";
    }

    private record EventResponseMetrics(
            long participantsCount,
            long waitlistCount,
            long favoriteCount,
            double averageRating,
            long feedbackCount
    ) {
    }

    private record EventResponseMetricsContext(Map<Long, EventResponseMetrics> metricsByEventId) {
        private static final EventResponseMetrics EMPTY = new EventResponseMetrics(0L, 0L, 0L, 0D, 0L);

        private EventResponseMetrics get(Long eventId) {
            if (eventId == null || metricsByEventId == null) {
                return EMPTY;
            }
            return metricsByEventId.getOrDefault(eventId, EMPTY);
        }
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException serverError(String message, Exception cause) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, message, cause);
    }
}
