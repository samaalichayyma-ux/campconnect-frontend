package com.esprit.campconnect.Reservation.Controller;

import com.esprit.campconnect.Reservation.DTO.PaymentProcessDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationFeedbackRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationRequestDTO;
import com.esprit.campconnect.Reservation.DTO.ReservationResponseDTO;
import com.esprit.campconnect.Reservation.DTO.StripeCheckoutSessionResponseDTO;
import com.esprit.campconnect.Reservation.DTO.StripeSessionSyncRequestDTO;
import com.esprit.campconnect.Reservation.DTO.UserReservationStatsDTO;
import com.esprit.campconnect.Reservation.Service.IReservationService;
import com.esprit.campconnect.Reservation.Service.ReservationExportService;
import com.esprit.campconnect.User.Entity.Utilisateur;
import com.esprit.campconnect.User.Repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "Reservation management endpoints")
public class ReservationController {

    private final IReservationService reservationService;
    private final ReservationExportService reservationExportService;
    private final UtilisateurRepository utilisateurRepository;

    // ============== CRUD ENDPOINTS ==============

    @PostMapping("/createReservation")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Create reservation", description = "Create a new reservation for an event")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Reservation created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid reservation data"),
            @ApiResponse(responseCode = "404", description = "Event or user not found")
    })
    public ResponseEntity<ReservationResponseDTO> createReservation(
            @Valid @RequestBody ReservationRequestDTO requestDTO,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        if (effectiveAuthentication == null || effectiveAuthentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user is required");
        }

        Utilisateur authenticatedUser = utilisateurRepository.findByEmail(effectiveAuthentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (requestDTO.getUtilisateurId() == null || !isAdministrator(effectiveAuthentication)) {
            requestDTO.setUtilisateurId(authenticatedUser.getId());
        }

        ReservationResponseDTO createdReservation = reservationService.createReservation(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReservation);
    }

    @GetMapping("/getReservation/{id}")
    @Operation(summary = "Get reservation by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation found"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponseDTO> getReservationById(
            @Parameter(description = "Reservation ID") @PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @GetMapping("/getAllReservations")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get all reservations", description = "Retrieve all reservations (admin only)")
    @ApiResponse(responseCode = "200", description = "List of all reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Get my reservations", description = "Retrieve reservations for the authenticated user")
    @ApiResponse(responseCode = "200", description = "List of the authenticated user's reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getMyReservations(Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.getReservationsForAuthenticatedUser(
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null
                )
        );
    }

    @GetMapping("/getByUser/{userId}")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Get user's reservations")
    @ApiResponse(responseCode = "200", description = "List of user's reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByUser(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(reservationService.getReservationsByUser(userId));
    }

    @GetMapping("/getByEvent/{eventId}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Get event's reservations")
    @ApiResponse(responseCode = "200", description = "List of reservations for event")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByEvent(
            @Parameter(description = "Event ID") @PathVariable Long eventId) {
        return ResponseEntity.ok(reservationService.getReservationsByEvent(eventId));
    }

    @PutMapping("/updateReservation/{id}")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Update reservation", description = "Update reservation details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid reservation data"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponseDTO> updateReservation(
            @Parameter(description = "Reservation ID") @PathVariable Long id,
            @Valid @RequestBody ReservationRequestDTO requestDTO) {
        return ResponseEntity.ok(reservationService.updateReservation(id, requestDTO));
    }

    @DeleteMapping("/cancelReservation/{id}")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Cancel reservation", description = "Cancel an existing reservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation cancelled"),
            @ApiResponse(responseCode = "400", description = "Reservation cannot be cancelled"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<Void> cancelReservation(
            @Parameter(description = "Reservation ID") @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        reservationService.cancelReservation(id, reason);
        return ResponseEntity.noContent().build();
    }

    // ============== RESERVATION MANAGEMENT ENDPOINTS ==============

    @PutMapping("/confirmReservation/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Confirm reservation", description = "Confirm a pending reservation (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation confirmed"),
            @ApiResponse(responseCode = "400", description = "Reservation cannot be confirmed")
    })
    public ResponseEntity<ReservationResponseDTO> confirmReservation(@PathVariable Long id) {
        reservationService.confirmReservation(id);
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @PutMapping("/rejectReservation/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Reject reservation", description = "Reject a pending reservation (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation rejected"),
            @ApiResponse(responseCode = "400", description = "Reservation cannot be rejected")
    })
    public ResponseEntity<ReservationResponseDTO> rejectReservation(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason) {
        reservationService.rejectReservation(id, reason);
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @PutMapping("/markAttended/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Mark as attended", description = "Mark reservation as attended after check-in once the event has started or completed")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Marked as attended"),
            @ApiResponse(responseCode = "400", description = "Cannot mark as attended")
    })
    public ResponseEntity<ReservationResponseDTO> markAsAttended(@PathVariable Long id, Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        reservationService.markAsAttended(
                id,
                effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                isAdministrator(effectiveAuthentication)
        );
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @PutMapping("/events/{eventId}/markAttended")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Bulk mark eligible reservations as attended", description = "Mark all confirmed or paid reservations for an event as attended once the event has started or completed")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Eligible reservations marked as attended"),
            @ApiResponse(responseCode = "400", description = "Attendance cannot be recorded yet for this event")
    })
    public ResponseEntity<List<ReservationResponseDTO>> markEligibleReservationsAsAttended(
            @PathVariable Long eventId,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.markEligibleReservationsAsAttended(
                        eventId,
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                        isAdministrator(effectiveAuthentication)
                )
        );
    }

    @PutMapping("/markNoShow/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Mark as no-show", description = "Mark reservation as no-show once the event has started or completed")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Marked as no-show"),
            @ApiResponse(responseCode = "400", description = "Cannot mark as no-show")
    })
    public ResponseEntity<ReservationResponseDTO> markAsNoShow(@PathVariable Long id, Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        reservationService.markAsNoShow(
                id,
                effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                isAdministrator(effectiveAuthentication)
        );
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    // ============== PAYMENT ENDPOINTS ==============

    @PostMapping("/{id}/checkout-session")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Create Stripe checkout session", description = "Create a Stripe-hosted checkout session for a confirmed reservation or a paid-required waitlist reservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Checkout session created"),
            @ApiResponse(responseCode = "400", description = "Reservation is not eligible for payment"),
            @ApiResponse(responseCode = "403", description = "Reservation does not belong to the authenticated user"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<StripeCheckoutSessionResponseDTO> createCheckoutSession(
            @PathVariable Long id,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.createCheckoutSession(
                        id,
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                        isAdministrator(effectiveAuthentication)
                )
        );
    }

    @PostMapping("/checkout-session/sync")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Sync Stripe checkout session", description = "Synchronize the reservation payment state from Stripe after redirect")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation synchronized"),
            @ApiResponse(responseCode = "400", description = "Invalid Stripe session"),
            @ApiResponse(responseCode = "403", description = "Reservation does not belong to the authenticated user"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponseDTO> syncCheckoutSession(
            @Valid @RequestBody StripeSessionSyncRequestDTO requestDTO,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.syncCheckoutSession(
                        requestDTO.getSessionId(),
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                        isAdministrator(effectiveAuthentication)
                )
        );
    }

    @GetMapping("/{id}/receipt")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Download reservation receipt", description = "Generate a PDF receipt for a paid, refunded, or billed reservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Receipt PDF generated"),
            @ApiResponse(responseCode = "403", description = "Reservation does not belong to the authenticated user"),
            @ApiResponse(responseCode = "404", description = "Reservation not found"),
            @ApiResponse(responseCode = "409", description = "Receipt is not available yet")
    })
    public ResponseEntity<byte[]> downloadReservationReceipt(
            @PathVariable Long id,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        byte[] receiptPdf = reservationService.generateReceiptPdf(
                id,
                effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                isAdministrator(effectiveAuthentication)
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservation-" + id + "-receipt.pdf")
                .body(receiptPdf);
    }

    @GetMapping("/{id}/calendar.ics")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Download reservation calendar invite", description = "Generate an .ics calendar file for an active reservation so guests can add it to Google Calendar, Apple Calendar, Outlook, or other calendar apps")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Calendar invite generated"),
            @ApiResponse(responseCode = "403", description = "Reservation does not belong to the authenticated user"),
            @ApiResponse(responseCode = "404", description = "Reservation not found"),
            @ApiResponse(responseCode = "409", description = "Calendar export is not available for this reservation")
    })
    public ResponseEntity<byte[]> downloadReservationCalendarInvite(
            @PathVariable Long id,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        byte[] calendarInvite = reservationService.generateCalendarInvite(
                id,
                effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                isAdministrator(effectiveAuthentication)
        );

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservation-" + id + "-calendar.ics")
                .body(calendarInvite);
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Submit reservation feedback", description = "Submit or update a post-event rating and comment for an attended reservation")
    public ResponseEntity<ReservationResponseDTO> submitFeedback(
            @PathVariable Long id,
            @Valid @RequestBody ReservationFeedbackRequestDTO requestDTO,
            Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.submitFeedback(
                        id,
                        requestDTO,
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null,
                        isAdministrator(effectiveAuthentication)
                )
        );
    }

    @GetMapping("/me/stats")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Get reservation dashboard stats", description = "Fetch reservation history and billing stats for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Reservation dashboard stats")
    public ResponseEntity<UserReservationStatsDTO> getMyReservationStats(Authentication authentication) {
        Authentication effectiveAuthentication = resolveAuthentication(authentication);
        return ResponseEntity.ok(
                reservationService.getReservationStatsForUser(
                        effectiveAuthentication != null ? effectiveAuthentication.getName() : null
                )
        );
    }

    @PostMapping("/processPayment")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Process payment", description = "Process payment for a reservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment processed"),
            @ApiResponse(responseCode = "400", description = "Invalid payment data"),
            @ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ReservationResponseDTO> processPayment(
            @Valid @RequestBody PaymentProcessDTO paymentDTO) {
        return ResponseEntity.ok(reservationService.processPayment(paymentDTO));
    }

    @PostMapping("/refundReservation/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Refund reservation", description = "Process refund for a paid reservation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Refund processed"),
            @ApiResponse(responseCode = "400", description = "Reservation cannot be refunded")
    })
    public ResponseEntity<Void> refundReservation(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String reason) {
        reservationService.refundReservation(id, reason);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/calculatePrice/{eventId}")
    @Operation(summary = "Calculate reservation price", description = "Calculate price for given number of participants")
    @ApiResponse(responseCode = "200", description = "Calculated price")
    public ResponseEntity<Double> calculateReservationPrice(
            @Parameter(description = "Event ID") @PathVariable Long eventId,
            @Parameter(description = "Number of participants") @RequestParam Integer numberOfParticipants) {
        return ResponseEntity.ok(reservationService.calculateReservationPrice(eventId, numberOfParticipants));
    }

    // ============== WAITLIST ENDPOINTS ==============

    @GetMapping("/getWaitlist/{eventId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get event waitlist", description = "Get all waitlist reservations for an event")
    @ApiResponse(responseCode = "200", description = "List of waitlist reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getEventWaitlist(
            @Parameter(description = "Event ID") @PathVariable Long eventId) {
        return ResponseEntity.ok(reservationService.getEventWaitlist(eventId));
    }

    @PutMapping("/processWaitlist/{eventId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Process waitlist", description = "Promote waitlist reservations to confirmed")
    @ApiResponse(responseCode = "200", description = "Waitlist processed")
    public ResponseEntity<Void> processWaitlist(@PathVariable Long eventId) {
        reservationService.processWaitlistToConfirmed(eventId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/isOnWaitlist/{userId}/{eventId}")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Check if user is on waitlist")
    @ApiResponse(responseCode = "200", description = "Waitlist status")
    public ResponseEntity<Boolean> isUserOnWaitlist(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Event ID") @PathVariable Long eventId) {
        return ResponseEntity.ok(reservationService.isUserOnWaitlist(userId, eventId));
    }

    // ============== QUERY ENDPOINTS ==============

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get pending reservations", description = "Get all pending reservations for admin approval")
    @ApiResponse(responseCode = "200", description = "List of pending reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getPendingReservations() {
        return ResponseEntity.ok(reservationService.getPendingReservations());
    }

    @GetMapping("/unpaid")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get unpaid reservations", description = "Get all unpaid reservations")
    @ApiResponse(responseCode = "200", description = "List of unpaid reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getUnpaidReservations() {
        return ResponseEntity.ok(reservationService.getUnpaidReservations());
    }

    @GetMapping("/refundable")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get refundable reservations", description = "Get cancelled or no-show reservations eligible for refund")
    @ApiResponse(responseCode = "200", description = "List of refundable reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getRefundableReservations() {
        return ResponseEntity.ok(reservationService.getRefundableReservations());
    }

    @GetMapping("/cancelled/{userId}")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'ADMINISTRATEUR')")
    @Operation(summary = "Get user's cancelled reservations")
    @ApiResponse(responseCode = "200", description = "List of cancelled reservations")
    public ResponseEntity<List<ReservationResponseDTO>> getUserCancelledReservations(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(reservationService.getUserCancelledReservations(userId));
    }

    // ============== ANALYTICS ENDPOINTS ==============

    @GetMapping("/analytics/revenue/{eventId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Get event revenue", description = "Calculate total revenue from paid reservations")
    @ApiResponse(responseCode = "200", description = "Total revenue amount")
    public ResponseEntity<Double> calculateEventRevenue(@PathVariable Long eventId) {
        return ResponseEntity.ok(reservationService.calculateEventRevenue(eventId));
    }

    @GetMapping("/analytics/confirmedCount/{eventId}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE')")
    @Operation(summary = "Count confirmed reservations")
    @ApiResponse(responseCode = "200", description = "Number of confirmed reservations")
    public ResponseEntity<Long> countConfirmedReservations(@PathVariable Long eventId) {
        return ResponseEntity.ok(reservationService.countConfirmedReservationsForEvent(eventId));
    }

    @GetMapping("/exports/guest-list/{eventId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Export guest list", description = "Download the guest list for an event in CSV or PDF format")
    public ResponseEntity<byte[]> exportGuestList(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "csv") String format) {
        ReservationExportService.ExportArtifact exportArtifact =
                reservationExportService.generateGuestList(eventId, reservationExportService.parseFormat(format));
        return buildExportResponse(exportArtifact);
    }

    @GetMapping("/exports/attendance-sheet/{eventId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Export attendance sheet", description = "Download the attendance sheet for an event in CSV or PDF format")
    public ResponseEntity<byte[]> exportAttendanceSheet(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "pdf") String format) {
        ReservationExportService.ExportArtifact exportArtifact =
                reservationExportService.generateAttendanceSheet(eventId, reservationExportService.parseFormat(format));
        return buildExportResponse(exportArtifact);
    }

    @GetMapping("/exports/reservation-report")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Export reservation report", description = "Download the reservation report in CSV or PDF format")
    public ResponseEntity<byte[]> exportReservationReport(
            @RequestParam(defaultValue = "csv") String format) {
        ReservationExportService.ExportArtifact exportArtifact =
                reservationExportService.generateReservationReport(reservationExportService.parseFormat(format));
        return buildExportResponse(exportArtifact);
    }

    @GetMapping("/exports/revenue-report")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Export revenue report", description = "Download the revenue report in CSV or PDF format")
    public ResponseEntity<byte[]> exportRevenueReport(
            @RequestParam(defaultValue = "pdf") String format) {
        ReservationExportService.ExportArtifact exportArtifact =
                reservationExportService.generateRevenueReport(reservationExportService.parseFormat(format));
        return buildExportResponse(exportArtifact);
    }

    private boolean isAdministrator(Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_ADMINISTRATEUR".equals(authority)
                        || "ADMINISTRATEUR".equals(authority));
    }

    private Authentication resolveAuthentication(Authentication authentication) {
        if (authentication != null) {
            return authentication;
        }

        return SecurityContextHolder.getContext().getAuthentication();
    }

    private ResponseEntity<byte[]> buildExportResponse(ReservationExportService.ExportArtifact exportArtifact) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(exportArtifact.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + exportArtifact.fileName())
                .body(exportArtifact.content());
    }
}
