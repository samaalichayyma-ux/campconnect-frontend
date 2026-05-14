package com.esprit.campconnect.Reservation.Entity;

import com.esprit.campconnect.Reservation.Enum.PromotionDiscountType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "promotion_offer")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class PromotionOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 64, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PromotionDiscountType discountType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(precision = 10, scale = 2)
    private BigDecimal minimumSubtotal;

    private Integer minimumParticipants;

    @Column(nullable = false)
    private Boolean autoApply = false;

    @Column(nullable = false)
    private Boolean discoverable = true;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    private Integer maxRedemptions;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime dateModification = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void normalizeFields() {
        if (code != null) {
            String normalizedCode = code.trim().toUpperCase(Locale.ROOT);
            code = normalizedCode.isEmpty() ? null : normalizedCode;
        }

        if (name != null) {
            name = name.trim();
        }

        dateModification = LocalDateTime.now();
    }
}
