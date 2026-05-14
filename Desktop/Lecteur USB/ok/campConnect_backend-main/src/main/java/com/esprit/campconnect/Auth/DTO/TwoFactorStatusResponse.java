package com.esprit.campconnect.Auth.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorStatusResponse {
    private boolean enabled;
    private boolean verified;
}