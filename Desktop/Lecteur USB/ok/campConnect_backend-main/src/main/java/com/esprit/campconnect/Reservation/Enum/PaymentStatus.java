package com.esprit.campconnect.Reservation.Enum;

public enum PaymentStatus {
    UNPAID,       // Payment not yet made
    PENDING,      // Payment in progress
    PAID,         // Payment successful
    PARTIALLY_REFUNDED, // Payment partially refunded after cancellation
    FAILED,       // Payment failed
    REFUNDED      // Payment refunded
}
