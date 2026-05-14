package com.esprit.campconnect.siteCamping.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SiteAvailabilityResponse {
    Long siteId;
    Integer capacite;
    Integer reservedGuests;
    Integer remainingCapacity;
}