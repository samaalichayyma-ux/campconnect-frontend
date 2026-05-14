package com.esprit.campconnect.InscriptionSite.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InscriptionCheckoutResponse {
    InscriptionSiteResponse inscription;
    String checkoutUrl;
    String sessionId;
}