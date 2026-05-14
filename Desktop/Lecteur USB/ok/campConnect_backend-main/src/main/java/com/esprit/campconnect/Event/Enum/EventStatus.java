package com.esprit.campconnect.Event.Enum;

public enum EventStatus {
    SCHEDULED,    // Event is scheduled but not yet started
    ONGOING,      // Event is currently happening
    COMPLETED,    // Event has finished
    CANCELLED,    // Event has been cancelled
    POSTPONED     // Event has been postponed
}
