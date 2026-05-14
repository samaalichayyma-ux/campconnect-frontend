package com.esprit.campconnect.Reservation.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserReservationStatsDTO {

    private Long totalReservations;
    private Long upcomingBookings;
    private Long eventsAttended;
    private BigDecimal totalSpent;
    private String favoriteEventCategory;
    private Long billedReservations;
    private Long waitlistReservations;
}
