package com.esprit.campconnect.Reservation.Controller;

import com.esprit.campconnect.Reservation.DTO.PromotionOfferRequestDTO;
import com.esprit.campconnect.Reservation.DTO.PromotionOfferResponseDTO;
import com.esprit.campconnect.Reservation.DTO.PromotionPreviewDTO;
import com.esprit.campconnect.Reservation.Service.PromotionOfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/promotions")
@CrossOrigin("*")
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "Promo code and discount endpoints")
public class PromotionOfferController {

    private final PromotionOfferService promotionOfferService;

    @GetMapping("/public/active")
    @Operation(summary = "Get public promotions", description = "List active and discoverable promo codes or auto-applied group offers")
    @ApiResponse(responseCode = "200", description = "List of active promotions")
    public ResponseEntity<List<PromotionOfferResponseDTO>> getPublicPromotions() {
        return ResponseEntity.ok(promotionOfferService.getPublicActivePromotions());
    }

    @GetMapping("/public/preview")
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

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "List all promotions", description = "Retrieve all promotion offers for administration")
    @ApiResponse(responseCode = "200", description = "List of promotions")
    public ResponseEntity<List<PromotionOfferResponseDTO>> getAllPromotions() {
        return ResponseEntity.ok(promotionOfferService.getAllPromotions());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Create promotion", description = "Create a new promo code or auto-applied discount")
    @ApiResponse(responseCode = "200", description = "Promotion created")
    public ResponseEntity<PromotionOfferResponseDTO> createPromotion(
            @Valid @RequestBody PromotionOfferRequestDTO requestDTO) {
        return ResponseEntity.ok(promotionOfferService.createPromotion(requestDTO));
    }

    @PutMapping("/admin/{promotionId}")
    @PreAuthorize("hasAuthority('ADMINISTRATEUR')")
    @Operation(summary = "Update promotion", description = "Update an existing promo code or discount campaign")
    @ApiResponse(responseCode = "200", description = "Promotion updated")
    public ResponseEntity<PromotionOfferResponseDTO> updatePromotion(
            @PathVariable Long promotionId,
            @Valid @RequestBody PromotionOfferRequestDTO requestDTO) {
        return ResponseEntity.ok(promotionOfferService.updatePromotion(promotionId, requestDTO));
    }
}
