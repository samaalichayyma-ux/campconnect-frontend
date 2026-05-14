package com.esprit.campconnect.Event.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventLifecycleScheduler {

    private final IEventService eventService;

    @Scheduled(cron = "${app.events.lifecycle-sync-cron:0 */15 * * * *}")
    public void synchronizeLifecycleStatuses() {
        log.debug("Running scheduled event lifecycle synchronization");
        eventService.synchronizeLifecycleStatuses();
    }
}
