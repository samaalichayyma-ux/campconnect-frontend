package com.esprit.campconnect.Reservation.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationMaintenanceScheduler {

    private final IReservationService reservationService;

    @Scheduled(cron = "${app.reservations.waitlist-reconciliation-cron:0 * * * * *}")
    public void reconcileExpiredWaitlistReservations() {
        log.debug("Running scheduled waitlist reconciliation");
        reservationService.reconcileExpiredWaitlistReservations();
    }
}
