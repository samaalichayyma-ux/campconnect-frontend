package com.esprit.campconnect.Auth.DTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)

public class AuthResponse {

    Long id;
    String token;
    String message;
    String role;

    boolean requires2FA;
    String tempToken;
}
