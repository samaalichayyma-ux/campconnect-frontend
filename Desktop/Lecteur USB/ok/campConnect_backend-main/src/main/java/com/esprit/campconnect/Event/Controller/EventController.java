package com.esprit.campconnect.Event.Controller;

import com.esprit.campconnect.Event.DTO.EventDuplicateRequestDTO;
import com.esprit.campconnect.Event.DTO.EventImageDTO;
import com.esprit.campconnect.Event.DTO.EventRequestDTO;
import com.esprit.campconnect.Event.DTO.EventResponseDTO;
import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Entity.EventImage;
import com.esprit.campconnect.Event.Enum.EventCategory;
import com.esprit.campconnect.Event.Enum.EventStatus;
import com.esprit.campconnect.Event.Repository.EventImageRepository;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Event.Service.IEventService;
import com.esprit.campconnect.User.Entity.Role;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import com.esprit.campconnect.Reservation.DTO.PromotionOfferResponseDTO;
import com.esprit.campconnect.Reservation.DTO.PromotionPreviewDTO;
import com.esprit.campconnect.Reservation.Service.PromotionOfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/events")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management endpoints")
public class EventController {

    private final IEventService eventService;
    private final UtilisateurRepository utilisateurRepository;
    private final EventRepository eventRepository;
    private final EventImageRepository eventImageRepository;
    private final PromotionOfferService promotionOfferService;

    // ============== CRUD ENDPOINTS ==============

    @PostMapping("/createEvent")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Create new event", description = "Create a new event (organizers only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Event created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid event data"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create events")
    })
    public ResponseEntity<EventResponseDTO> createEvent(
            @Valid @RequestBody EventRequestDTO eventDTO,
            Authentication authentication) {
        Utilisateur organizer = getCurrentUser(authentication);
        EventResponseDTO createdEvent = eventService.createEvent(eventDTO, organizer.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    @GetMapping("/getEvent/{id}")
    @Operation(summary = "Get event by ID")
    @ApiResponse(responseCode = "200", description = "Event found")
    public ResponseEntity<EventResponseDTO> getEventById(
            @Parameter(description = "Event ID") @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(requireVisibleEvent(id, authentication));
    }

    @GetMapping("/getAllEvents")
    @Operation(summary = "Get all events")
    @ApiResponse(responseCode = "200", description = "List of all events")
    public ResponseEntity<List<EventResponseDTO>> getAllEvents(Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getAllEvents(), authentication));
    }

    @PutMapping("/updateEvent/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Update event", description = "Update event details (organizer or admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid event data"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update this event"),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    public ResponseEntity<EventResponseDTO> updateEvent(
            @Parameter(description = "Event ID") @PathVariable Long id,
            @Valid @RequestBody EventRequestDTO eventDTO,
            Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElseThrow(() -> 
            new RuntimeException("Event not found with id: " + id));
        
        boolean isOrganizer = event.getOrganizer().getId().equals(currentUser.getId());
        boolean hasAdminRole = hasEventManagementRole(currentUser);
        
        if (!isOrganizer && !hasAdminRole) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(eventService.updateEvent(id, eventDTO));
    }

    @DeleteMapping("/deleteEvent/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Delete event", description = "Delete an event (organizer or admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Event deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete this event"),
            @ApiResponse(responseCode = "404", description = "Event not found")
    })
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "Event ID") @PathVariable Long id,
            Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(id).orElseThrow(() -> 
            new RuntimeException("Event not found with id: " + id));
        
        boolean isOrganizer = event.getOrganizer().getId().equals(currentUser.getId());
        boolean hasAdminRole = hasEventManagementRole(currentUser);
        
        if (!isOrganizer && !hasAdminRole) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Publish event", description = "Make an event visible on public event pages")
    public ResponseEntity<EventResponseDTO> publishEvent(@PathVariable Long id, Authentication authentication) {
        validateEventManagementAccess(id, authentication);
        return ResponseEntity.ok(eventService.publishEvent(id));
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Unpublish event", description = "Move an event back to draft mode")
    public ResponseEntity<EventResponseDTO> unpublishEvent(@PathVariable Long id, Authentication authentication) {
        validateEventManagementAccess(id, authentication);
        return ResponseEntity.ok(eventService.unpublishEvent(id));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Duplicate recurring event", description = "Create weekly, monthly, or yearly copies of an event")
    public ResponseEntity<List<EventResponseDTO>> duplicateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventDuplicateRequestDTO requestDTO,
            Authentication authentication) {
        Utilisateur currentUser = validateEventManagementAccess(id, authentication);
        List<EventResponseDTO> duplicates = eventService.duplicateEvent(id, requestDTO, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicates);
    }

    @GetMapping("/favorites/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my favorite events")
    public ResponseEntity<List<EventResponseDTO>> getMyFavoriteEvents(Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(filterVisibleEvents(eventService.getFavoriteEvents(currentUser.getId()), authentication));
    }

    @PostMapping("/{eventId}/favorite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Save event as favorite")
    public ResponseEntity<Void> addFavorite(@PathVariable Long eventId, Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        requireVisibleEvent(eventId, authentication);
        eventService.addFavorite(eventId, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{eventId}/favorite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove saved event")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long eventId, Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        eventService.removeFavorite(eventId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    // ============== SEARCH & FILTER ENDPOINTS ==============

    @GetMapping("/getByOrganizer/{organizerId}")
    @Operation(summary = "Get events by organizer")
    @ApiResponse(responseCode = "200", description = "List of organizer's events")
    public ResponseEntity<List<EventResponseDTO>> getEventsByOrganizer(
            @Parameter(description = "Organizer ID") @PathVariable Long organizerId,
            Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getEventsByOrganizer(organizerId), authentication));
    }

    @GetMapping("/getByCategory/{categorie}")
    @Operation(summary = "Get events by category")
    @ApiResponse(responseCode = "200", description = "List of events by category")
    public ResponseEntity<List<EventResponseDTO>> getEventsByCategory(
            @Parameter(description = "Event category") @PathVariable EventCategory categorie,
            Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getEventsByCategory(categorie), authentication));
    }

    @GetMapping("/getByStatus/{statut}")
    @Operation(summary = "Get events by status")
    @ApiResponse(responseCode = "200", description = "List of events by status")
    public ResponseEntity<List<EventResponseDTO>> getEventsByStatus(
            @Parameter(description = "Event status") @PathVariable EventStatus statut,
            Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getEventsByStatus(statut), authentication));
    }

    @GetMapping("/getUpcoming")
    @Operation(summary = "Get upcoming events")
    @ApiResponse(responseCode = "200", description = "List of upcoming events")
    public ResponseEntity<List<EventResponseDTO>> getUpcomingEvents(Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getUpcomingEvents(), authentication));
    }

    @GetMapping("/search")
    @Operation(summary = "Search events", description = "Search events by keyword in title or description")
    @ApiResponse(responseCode = "200", description = "Search results")
    public ResponseEntity<List<EventResponseDTO>> searchEvents(
            @Parameter(description = "Search keyword") @RequestParam String keyword,
            Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.searchEvents(keyword), authentication));
    }

    @GetMapping("/getByLocation")
    @Operation(summary = "Get events by location")
    @ApiResponse(responseCode = "200", description = "List of events in location")
    public ResponseEntity<List<EventResponseDTO>> getEventsByLocation(
            @Parameter(description = "Location name") @RequestParam String lieu,
            Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getEventsByLocation(lieu), authentication));
    }

    // ============== AVAILABILITY ENDPOINTS ==============

    @GetMapping("/available")
    @Operation(summary = "Get available events", description = "Get events with available spots")
    @ApiResponse(responseCode = "200", description = "List of available events")
    public ResponseEntity<List<EventResponseDTO>> getAvailableEvents(Authentication authentication) {
        return ResponseEntity.ok(filterVisibleEvents(eventService.getAvailableEvents(), authentication));
    }

    @GetMapping("/availableSeats/{id}")
    @Operation(summary = "Get available seats for event")
    @ApiResponse(responseCode = "200", description = "Number of available seats")
    public ResponseEntity<Integer> getAvailableSeats(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getAvailableSeats(id));
    }

    @GetMapping("/participants/{id}/count")
    @Operation(summary = "Get participant count")
    @ApiResponse(responseCode = "200", description = "Number of confirmed participants")
    public ResponseEntity<Long> getParticipantCount(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getParticipantCount(id));
    }

    @GetMapping("/waitlist/{id}/count")
    @Operation(summary = "Get waitlist count")
    @ApiResponse(responseCode = "200", description = "Number of waitlist participants")
    public ResponseEntity<Long> getWaitlistCount(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getWaitlistCount(id));
    }

    @GetMapping("/promotions/active")
    @Operation(summary = "Get public promotions", description = "List active and discoverable promo codes or auto-applied group offers")
    @ApiResponse(responseCode = "200", description = "List of active promotions")
    public ResponseEntity<List<PromotionOfferResponseDTO>> getPublicPromotions() {
        return ResponseEntity.ok(promotionOfferService.getPublicActivePromotions());
    }

    @GetMapping("/pricing/preview")
    @Operation(summary = "Preview discounted reservation price", description = "Preview the final reservation total after promo codes or auto group offers are applied")
    @ApiResponse(responseCode = "200", description = "Pricing preview generated")
    public ResponseEntity<PromotionPreviewDTO> previewReservationPricing(
            @RequestParam Long eventId,
            @RequestParam Integer numberOfParticipants,
            @RequestParam(required = false) String promoCode) {
        return ResponseEntity.ok(
                promotionOfferService.previewReservationPricing(eventId, numberOfParticipants, promoCode)
        );
    }

    // ============== STATUS MANAGEMENT ENDPOINTS ==============

    @PutMapping("/startEvent/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Start event", description = "Change event status to ONGOING (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event started"),
            @ApiResponse(responseCode = "400", description = "Event cannot be started")
    })
    public ResponseEntity<EventResponseDTO> startEvent(@PathVariable Long id) {
        eventService.startEvent(id);
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PutMapping("/completeEvent/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Complete event", description = "Change event status to COMPLETED (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event completed"),
            @ApiResponse(responseCode = "400", description = "Event cannot be completed")
    })
    public ResponseEntity<EventResponseDTO> completeEvent(@PathVariable Long id) {
        eventService.completeEvent(id);
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PutMapping("/cancelEvent/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Cancel event", description = "Cancel an event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event cancelled"),
            @ApiResponse(responseCode = "400", description = "Event cannot be cancelled")
    })
    public ResponseEntity<EventResponseDTO> cancelEvent(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        eventService.cancelEvent(id, reason);
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PutMapping("/postponeEvent/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Postpone event", description = "Postpone an event to new dates")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Event postponed"),
            @ApiResponse(responseCode = "400", description = "Event cannot be postponed")
    })
    public ResponseEntity<EventResponseDTO> postponeEvent(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newStartDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newEndDate) {
        eventService.postponeEvent(id, newStartDate, newEndDate);
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // ============== ANALYTICS ENDPOINTS ==============

    @GetMapping("/analytics/revenue/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get event revenue", description = "Calculate total revenue for an event")
    @ApiResponse(responseCode = "200", description = "Total revenue amount")
    public ResponseEntity<Double> getEventRevenue(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.calculateEventRevenue(id));
    }

    @GetMapping("/analytics/organizer/{organizerId}/totalParticipants")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get organizer total participants")
    @ApiResponse(responseCode = "200", description = "Total participants across all events")
    public ResponseEntity<Integer> getTotalParticipantsForOrganizer(@PathVariable Long organizerId) {
        return ResponseEntity.ok(eventService.getTotalParticipantsForOrganizer(organizerId));
    }

    @GetMapping("/getByDateRange")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get events by date range")
    @ApiResponse(responseCode = "200", description = "List of events in date range")
    public ResponseEntity<List<EventResponseDTO>> getEventsBetweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(eventService.getEventsBetweenDates(startDate, endDate));
    }

    // ============== IMAGE UPLOAD ENDPOINTS ==============

    @PostMapping(value = "/{eventId}/addImage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Add image to event", description = "Upload and add an image to an existing event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Image successfully added"),
            @ApiResponse(responseCode = "400", description = "Invalid file or event not found"),
            @ApiResponse(responseCode = "500", description = "Server error during image processing")
    })
    public ResponseEntity<EventResponseDTO> addImageToEvent(
            @PathVariable Long eventId,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(defaultValue = "false") boolean makePrimary,
            Authentication authentication) {
        validateEventImageManagementAccess(eventId, authentication);
        EventResponseDTO updatedEvent = eventService.addImagesToEvent(eventId, List.of(imageFile), makePrimary);
        return ResponseEntity.status(HttpStatus.CREATED).body(updatedEvent);
    }

    @PostMapping(value = "/{eventId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Add multiple images to event", description = "Upload one or more images to an existing event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Images successfully added"),
            @ApiResponse(responseCode = "400", description = "Invalid file or event not found"),
            @ApiResponse(responseCode = "500", description = "Server error during image processing")
    })
    public ResponseEntity<EventResponseDTO> addImagesToEvent(
            @PathVariable Long eventId,
            @RequestPart("images") List<MultipartFile> imageFiles,
            @RequestParam(defaultValue = "false") boolean makePrimary,
            Authentication authentication) {
        validateEventImageManagementAccess(eventId, authentication);
        EventResponseDTO updatedEvent = eventService.addImagesToEvent(eventId, imageFiles, makePrimary);
        return ResponseEntity.status(HttpStatus.CREATED).body(updatedEvent);
    }

    @PostMapping(value = {"/addImages", "/createEventWithImages"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create event with images", description = "Create a new event with multiple images")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Event created with images"),
            @ApiResponse(responseCode = "400", description = "Invalid request or file format"),
            @ApiResponse(responseCode = "500", description = "Server error during image processing")
    })
    public ResponseEntity<EventResponseDTO> createEventWithImages(
            @Valid @RequestPart("event") EventRequestDTO eventDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> imageFiles,
            Authentication authentication) {
        Utilisateur organizer = getCurrentUser(authentication);
        if (!hasEventManagementRole(organizer)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        EventResponseDTO createdEvent = eventService.createEventWithImages(eventDTO, imageFiles, organizer.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    @DeleteMapping("/{eventId}/images/{imageId}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Delete event image", description = "Remove a specific image from an event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Image or event not found"),
            @ApiResponse(responseCode = "500", description = "Server error during deletion")
    })
    public ResponseEntity<Void> deleteEventImage(
            @PathVariable Long eventId,
            @PathVariable Long imageId) {
        eventService.deleteEventImage(eventId, imageId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{eventId}/images/{imageId}/setAsPrimary")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Set image as primary", description = "Set an event image as the primary image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Primary image updated"),
            @ApiResponse(responseCode = "404", description = "Image or event not found")
    })
    public ResponseEntity<EventResponseDTO> setImageAsPrimary(
            @PathVariable Long eventId,
            @PathVariable Long imageId) {
        EventResponseDTO updatedEvent = eventService.setImageAsPrimary(eventId, imageId);
        return ResponseEntity.ok(updatedEvent);
    }

    @GetMapping("/images/{imageId}")
    @Operation(summary = "Get event image", description = "Retrieve a specific event image by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image retrieved"),
            @ApiResponse(responseCode = "404", description = "Image not found")
    })
    public ResponseEntity<EventImageDTO> getEventImage(@PathVariable Long imageId) {
        EventImageDTO image = eventService.getEventImageById(imageId);
        return ResponseEntity.ok(image);
    }

    @GetMapping("/images/{imageId}/content")
    @Operation(summary = "Get event image content", description = "Stream image bytes for a specific event image")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Image content retrieved"),
            @ApiResponse(responseCode = "404", description = "Image not found")
    })
    public ResponseEntity<ByteArrayResource> getEventImageContent(@PathVariable Long imageId) throws IOException {
        EventImage eventImage = eventImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));

        byte[] imageBytes = loadImageBytes(eventImage);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (eventImage.getMimeType() != null && !eventImage.getMimeType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(eventImage.getMimeType());
            } catch (IllegalArgumentException ignored) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(imageBytes.length)
                .body(new ByteArrayResource(imageBytes));
    }

    @GetMapping("/{eventId}/images")
    @Operation(summary = "Get all event images", description = "Retrieve all images for a specific event")
    @ApiResponse(responseCode = "200", description = "List of event images")
    public ResponseEntity<List<EventImageDTO>> getEventImages(@PathVariable Long eventId) {
        List<EventImageDTO> images = eventService.getEventImages(eventId);
        return ResponseEntity.ok(images);
    }

    private Utilisateur getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return utilisateurRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private boolean hasEventManagementRole(Utilisateur user) {
        return user.getRole() == Role.ADMINISTRATEUR
                || user.getRole() == Role.GERANT_RESTAU
                || user.getRole() == Role.GUIDE;
    }

    private EventResponseDTO requireVisibleEvent(Long eventId, Authentication authentication) {
        EventResponseDTO event = eventService.getEventById(eventId);
        if (Boolean.FALSE.equals(event.getPublished()) && !canAccessUnpublishedEvents(authentication)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found with id: " + eventId);
        }
        return event;
    }

    private List<EventResponseDTO> filterVisibleEvents(List<EventResponseDTO> events, Authentication authentication) {
        if (canAccessUnpublishedEvents(authentication)) {
            return events;
        }

        return events.stream()
                .filter(event -> !Boolean.FALSE.equals(event.getPublished()))
                .toList();
    }

    private boolean canAccessUnpublishedEvents(Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        try {
            return hasEventManagementRole(getCurrentUser(authentication));
        } catch (ResponseStatusException exception) {
            return false;
        }
    }

    private Utilisateur validateEventManagementAccess(Long eventId, Authentication authentication) {
        Utilisateur currentUser = getCurrentUser(authentication);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found with id: " + eventId));

        boolean isOrganizer = event.getOrganizer() != null
                && event.getOrganizer().getId() != null
                && event.getOrganizer().getId().equals(currentUser.getId());

        if (!isOrganizer && !hasEventManagementRole(currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to manage this event");
        }

        return currentUser;
    }

    private void validateEventImageManagementAccess(Long eventId, Authentication authentication) {
        validateEventManagementAccess(eventId, authentication);
    }

    private byte[] loadImageBytes(EventImage eventImage) throws IOException {
        if (eventImage.getImageData() != null && !eventImage.getImageData().isBlank()) {
            return decodeBase64Image(eventImage.getImageData());
        }

        String imagePath = eventImage.getImageUrl();
        if (imagePath == null || imagePath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image file path not found");
        }

        Path path = resolveImagePath(imagePath);
        if (!Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image file not found");
        }

        byte[] imageBytes = Files.readAllBytes(path);
        eventImage.setImageData(Base64.getEncoder().encodeToString(imageBytes));
        eventImageRepository.save(eventImage);
        return imageBytes;
    }

    private Path resolveImagePath(String imagePath) {
        String normalizedPath = imagePath.replace('\\', '/').trim();
        Path path = Paths.get(imagePath);
        if (path.isAbsolute() && Files.exists(path)) {
            return path.normalize();
        }

        Path relativePath = Paths.get(normalizedPath);
        if (Files.exists(relativePath)) {
            return relativePath.normalize();
        }

        int uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");
        if (uploadsIndex >= 0) {
            Path uploadsPath = Paths.get(normalizedPath.substring(uploadsIndex));
            if (Files.exists(uploadsPath)) {
                return uploadsPath.normalize();
            }
        }

        return relativePath.normalize();
    }

    private byte[] decodeBase64Image(String imageData) {
        String payload = imageData;
        int separatorIndex = payload.indexOf(',');
        if (separatorIndex >= 0) {
            payload = payload.substring(separatorIndex + 1);
        }
        return Base64.getDecoder().decode(payload);
    }
}
