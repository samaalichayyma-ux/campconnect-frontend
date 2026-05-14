package com.esprit.campconnect.Reservation.DTO;

import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaymentProcessDTO {

    @NotNull(message = "L'ID de la réservation est requis")
    private Long reservationId;

    @NotNull(message = "L'ID de transaction est requis")
    private String transactionId;

    @NotNull(message = "Le statut de paiement est requis")
    private PaymentStatus statutPaiement;

    private String paymentMethod; // CREDIT_CARD, PAYPAL, BANK_TRANSFER, etc.

    private String remarques;
}
